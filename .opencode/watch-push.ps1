
$ErrorActionPreference = "Stop"

$projectPath = "C:\Users\o.sheremet\Documents\GitHub\health-fit-release.2.0"
$runnerPath = Join-Path $PSScriptRoot "run-i18n-audit.ps1"

Set-Location $projectPath

Write-Host "Git Push watcher started." -ForegroundColor Green
Write-Host "Project: $projectPath"
Write-Host "Polling interval: 2 seconds"
Write-Host "Mode: automatic i18n audit after successful Push."
Write-Host "Press Ctrl+C to stop."
Write-Host ""

function Get-PushEvents {
    $output = git reflog show --all --date=iso --format="%gD|%gs|%H"

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to read Git reflog."
    }

    foreach ($line in $output) {
        if ($line -match '^(refs/remotes/.+?)@\{(.+?)\}\|update by push\|([0-9a-f]{40,64})$') {
            [PSCustomObject]@{
                Signature = $line
                Ref       = $Matches[1]
                Date      = $Matches[2]
                SHA       = $Matches[3]
            }
        }
    }
}

# Load existing events so old Push operations are ignored.
$knownEvents = [System.Collections.Generic.HashSet[string]]::new(
    [System.StringComparer]::Ordinal
)

Get-PushEvents | ForEach-Object {
    [void]$knownEvents.Add($_.Signature)
}

Write-Host "Baseline loaded. Existing Push events will be ignored." -ForegroundColor Cyan
Write-Host "Waiting for a new Push..." -ForegroundColor Yellow
Write-Host ""

while ($true) {
    Start-Sleep -Seconds 2

    try {
        $events = @(Get-PushEvents)

        foreach ($event in $events) {
            if ($knownEvents.Add($event.Signature)) {
                Write-Host ""
                Write-Host "NEW SUCCESSFUL PUSH DETECTED" -ForegroundColor Green
                Write-Host "Date:   $($event.Date)"
                Write-Host "Branch: $($event.Ref)"
                Write-Host "SHA:    $($event.SHA)"
                Write-Host "Starting i18n audit..."
                Write-Host "----------------------------------------"

                try {
                    & $runnerPath -PushSha $event.SHA -PushRef $event.Ref

                    Write-Host "Runner finished for SHA: $($event.SHA)" -ForegroundColor Green
                }
                catch {
                    Write-Host "Audit failed for SHA: $($event.SHA)" -ForegroundColor Red
                    Write-Host $_.Exception.Message -ForegroundColor Red
                    Write-Host "Watcher will continue monitoring." -ForegroundColor Yellow
                }

                Write-Host ""
                Write-Host "Waiting for a new Push..." -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "Watcher error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
