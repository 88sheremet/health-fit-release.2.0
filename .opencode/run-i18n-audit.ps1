param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-fA-F]{40,64}$')]
    [string]$PushSha,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$PushRef
)

$ErrorActionPreference = "Stop"

$projectPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectPath

$lockStream = $null

try {
    Write-Host "=== Health Fit i18n Audit Launcher ===" -ForegroundColor Cyan
    Write-Host "Push SHA: $PushSha"
    Write-Host "Push ref: $PushRef"

    # Resolve the actual Git directory.
    $gitDir = (& git rev-parse --git-dir 2>&1).Trim()

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to resolve Git directory."
    }

    if ([System.IO.Path]::IsPathRooted($gitDir)) {
        $gitDirAbsolute = $gitDir
    }
    else {
        $gitDirAbsolute = [System.IO.Path]::GetFullPath(
            (Join-Path $projectPath $gitDir)
        )
    }

    # Use a separate location. Never touch .git\opencode.
    $stateDirectory = Join-Path $gitDirAbsolute "opencode-i18n-audit"

    New-Item -ItemType Directory -Path $stateDirectory -Force |
        Out-Null

    $stateFile = Join-Path $stateDirectory "last-processed-sha"
    $lockFile = Join-Path $stateDirectory "audit.lock"

    # Prevent concurrent audit runs.
    try {
        $lockStream = [System.IO.File]::Open(
            $lockFile,
            [System.IO.FileMode]::OpenOrCreate,
            [System.IO.FileAccess]::ReadWrite,
            [System.IO.FileShare]::None
        )
    }
    catch {
        throw "Another i18n audit is already running."
    }

    # Check that the pushed commit exists locally.
    & git cat-file -e "${PushSha}^{commit}" 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "Pushed commit does not exist in the local repository."
    }

    # Only audit the exact commit that was pushed.
    $headSha = (& git rev-parse HEAD).Trim()

    if ($LASTEXITCODE -ne 0 -or $headSha -ne $PushSha) {
        throw "Local HEAD does not match the pushed SHA. Audit skipped."
    }

    # Skip a SHA that was already processed successfully.
    if (Test-Path -LiteralPath $stateFile) {
        $previousSha = (Get-Content -Raw -LiteralPath $stateFile).Trim()

        if ($previousSha -eq $PushSha) {
            Write-Host "This SHA was already processed. Skipping." -ForegroundColor Yellow
            return
        }
    }

    # Never overwrite uncommitted localization changes.
    $localizationChanges = & git status --porcelain -- i18n/locales 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect localization file status."
    }

    if ($localizationChanges) {
        Write-Host "Localization files contain uncommitted changes:" -ForegroundColor Yellow
        $localizationChanges | ForEach-Object { Write-Host $_ }
        throw "Audit skipped to protect user changes."
    }

    # Confirm OpenCode CLI is available.
    if (-not (Get-Command opencode.cmd -ErrorAction SilentlyContinue)) {
        throw "opencode.cmd was not found in PATH."
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $logFile = Join-Path $stateDirectory "audit-$timestamp.log"

    $prompt = @"
Run the complete i18n-localization-expert Skill.

The external launcher confirmed this successful GitHub Desktop Push:
- Commit SHA: $PushSha
- Remote ref: $PushRef

Audit the entire project according to the Skill.
Preserve user changes and follow all agent permissions.
Do not manage the processed SHA state file.
Do not commit or push anything.

Return the complete structured Localization Audit Report.
"@

    Write-Host ""
    Write-Host "Starting i18n-audit agent..." -ForegroundColor Cyan
    Write-Host "Log: $logFile"
    Write-Host ""

    $output = & opencode.cmd run `
        --agent i18n-audit `
        --model opencode/deepseek-v4.1-flash-free `
        --dir $projectPath `
        --format default `
        $prompt 2>&1 | Tee-Object -FilePath $logFile

    $opencodeExitCode = $LASTEXITCODE
    $outputText = ($output | ForEach-Object { "$_" }) -join "`n"

    if ($opencodeExitCode -ne 0) {
        throw "OpenCode exited with code $opencodeExitCode. SHA was not saved."
    }

        # Read the final status from the agent's structured report.
    $statusMatches = [regex]::Matches(
        $outputText,
        '(?is)\*\*Final Status:\*\*\s*(?:[-*]\s*)?`?(Successful|Warnings|Failed)`?'
    )

    if ($statusMatches.Count -eq 0) {
        throw "Final audit status was not found. SHA was not saved."
    }

    $finalStatus = $statusMatches[$statusMatches.Count - 1].Groups[1].Value

    if ($finalStatus -notin @("Successful", "Warnings")) {
        throw "Audit status is $finalStatus. SHA was not saved."
    }

    # Confirm Node.js is available.
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js was not found in PATH. SHA was not saved."
    }

    # Run mandatory localization validation after the agent finishes.
    Write-Host ""
    Write-Host "Running external localization validation..." -ForegroundColor Cyan

    $validationOutput = & node .opencode\validate-i18n.mjs 2>&1 |
        Tee-Object -FilePath $logFile -Append

    $validationExitCode = $LASTEXITCODE
    $validationText = ($validationOutput | ForEach-Object { "$_" }) -join "`n"

    if ($validationExitCode -ne 0) {
        throw "Localization validation failed. SHA was not saved. Check the log."
    }

    $requiredValidationResults = @(
        'JSON validation:\s*Passed\b',
        'Key synchronization:\s*Passed\b',
        'Technical integrity:\s*Passed\b',
        'Final Status:\s*Successful\b'
    )

    foreach ($check in $requiredValidationResults) {
        if (-not [regex]::IsMatch(
            $validationText,
            $check,
            [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
        )) {
            throw "A required validation result is missing. SHA was not saved."
        }
    }

    Write-Host "External validation: Passed" -ForegroundColor Green

    # Ensure HEAD did not change during the audit.
    $headAfterAudit = (& git rev-parse HEAD).Trim()

    if ($LASTEXITCODE -ne 0 -or $headAfterAudit -ne $PushSha) {
        throw "HEAD changed during the audit. SHA was not saved."
    }

    # Atomically persist the SHA only after successful validation.
    $temporaryStateFile = "$stateFile.tmp-$PID"

    [System.IO.File]::WriteAllText(
        $temporaryStateFile,
        "$PushSha`r`n",
        [System.Text.UTF8Encoding]::new($false)
    )

    Move-Item -LiteralPath $temporaryStateFile -Destination $stateFile -Force

    Write-Host ""
    Write-Host "Audit completed: $finalStatus" -ForegroundColor Green
    Write-Host "Processed SHA saved: $PushSha" -ForegroundColor Green
    Write-Host "Log: $logFile"
}
catch {
    Write-Host ""
    Write-Host "AUDIT NOT MARKED AS PROCESSED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    throw
}
finally {
    if ($null -ne $lockStream) {
        $lockStream.Dispose()
    }
}

