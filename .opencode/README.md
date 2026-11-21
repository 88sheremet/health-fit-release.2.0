# Health Fit — Automated Localization Audit

## 1. Quick Overview

### Workflow

```text
Start PowerShell Watcher
        ↓
GitHub Desktop: Successful Push
        ↓
Watcher detects new Push (SHA + branch)
        ↓
OpenCode CLI starts i18n-audit agent
        ↓
Agent runs localization audit and safe fixes
        ↓
Runner executes validate-i18n.mjs
        ↓
Validation passed?
    ┌───┴───┐
   Yes      No
    ↓        ↓
Save SHA   Do not save SHA
```

**Purpose:** Automatically audit and safely improve Russian (`ru`) and Ukrainian (`uk`) localization after a successful Git Push.

## 2. Startup

Run the following commands in PowerShell from the project root:

```powershell
cd C:\Users\o.sheremet\Documents\GitHub\health-fit-release.2.0

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".opencode\watch-push.ps1"
```

Wait for:

```text
Baseline loaded. Existing Push events will be ignored.
Waiting for a new Push...
```

The watcher is now active. You can continue working and push changes through GitHub Desktop.

**OpenCode UI does not need to be running.** The watcher starts OpenCode CLI automatically.

To stop the watcher, press `Ctrl + C`.

## 3. How It Works

1. **Watcher:** Monitors Git reflog every 2 seconds.
2. **Push detection:** Detects new successful remote ref updates and extracts the commit SHA and branch.
3. **Runner:** Starts the `i18n-audit` OpenCode agent.
4. **Localization Skill:** Audits the entire project and fixes clear, unambiguous localization issues.
5. **External validation:** Runs `validate-i18n.mjs` after the agent finishes.
6. **SHA persistence:** Saves the processed SHA only when the audit and mandatory validation succeed.

The watcher ignores Push events that existed before it started. Missed events are not queued or replayed.

## 4. Files and Responsibilities

| File | Responsibility |
|---|---|
| `.opencode/skills/i18n-localization-expert/SKILL.md` | Localization audit rules |
| `.opencode/agents/i18n-audit.md` | Agent configuration and permissions |
| `.opencode/watch-push.ps1` | Git Push monitoring |
| `.opencode/run-i18n-audit.ps1` | Agent execution, validation and SHA persistence |
| `.opencode/validate-i18n.mjs` | Technical localization validation |

Runtime files are stored locally inside:

```text
.git/opencode-i18n-audit/
├── audit.lock
├── last-processed-sha
└── audit-*.log
```

These files are Git-local and are not part of the project source.

## 5. Validation

The external validator checks:

- JSON syntax.
- RU/UK translation key synchronization.
- Placeholder integrity.
- HTML tag integrity.
- ICU message structure, if present.
- `daily.reward` pluralization structure (three variants).

Run validation manually:

```powershell
node .opencode\validate-i18n.mjs
```

Expected successful output:

```text
JSON validation: Passed
Key synchronization: Passed
Pluralization structure: Passed
Technical integrity: Passed
Final Status: Successful
```

No separate pluralization runtime check or full project test suite is performed.

## 6. Safety Rules and Limitations

- Supports Push events from any branch.
- Only new successful Push events are processed.
- Uncommitted localization changes cause the audit to be skipped.
- The agent can edit only `i18n/locales/ru.json` and `i18n/locales/uk.json`.
- Supabase data and schemas are read-only.
- No unrelated refactoring, business logic or UI layout changes.
- No Git commit, push, reset or checkout operations.
- Failed or interrupted audits must not be marked as processed.
- A previously successful SHA is skipped to prevent duplicate audits.
- Runner checks that local HEAD matches the pushed SHA before starting.

## 7. Logs and Troubleshooting

Find the latest audit log:

```powershell
$log = Get-ChildItem .git\opencode-i18n-audit\audit-*.log |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

Get-Content $log.FullName
```

Check agent configuration:

```powershell
opencode.cmd debug agent i18n-audit
```

Check Git changes:

```powershell
git status --short
```

Check recent Push events:

```powershell
git reflog show --all --date=iso --format="%gD|%gs|%H" |
Where-Object { $_ -match '^refs/remotes/.+@\{.+\}\|update by push\|' } |
Select-Object -First 10
```

**Important:** If the watcher is stopped, Push events made during that time will not trigger an audit when it starts again.

---

# Health Fit — Автоматизований аудит локалізації

## 1. Коротка схема

### Процес роботи

```text
Запуск PowerShell Watcher
        ↓
GitHub Desktop: успішний Push
        ↓
Watcher знаходить новий Push (SHA + гілка)
        ↓
OpenCode CLI запускає агента i18n-audit
        ↓
Агент перевіряє локалізацію та виправляє безпечні помилки
        ↓
Runner запускає validate-i18n.mjs
        ↓
Перевірки пройшли успішно?
    ┌───┴───┐
   Так      Ні
    ↓        ↓
Зберегти   Не зберігати
SHA        SHA
```

**Призначення:** автоматично перевіряти та безпечно покращувати російську (`ru`) й українську (`uk`) локалізації після успішного Git Push.

## 2. Запуск

Виконай команди в PowerShell із кореня проєкту:

```powershell
cd C:\Users\o.sheremet\Documents\GitHub\health-fit-release.2.0

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".opencode\watch-push.ps1"
```

Дочекайся повідомлень:

```text
Baseline loaded. Existing Push events will be ignored.
Waiting for a new Push...
```

Watcher готовий до роботи. Можна продовжувати розробку та виконувати Push через GitHub Desktop.

**Відкривати інтерфейс OpenCode не потрібно.** Watcher самостійно запускає OpenCode CLI.

Для зупинки натисни `Ctrl + C`.

## 3. Як працює автоматизація

1. **Watcher:** перевіряє Git reflog кожні 2 секунди.
2. **Виявлення Push:** знаходить нові успішні оновлення remote ref та отримує SHA коміту й назву гілки.
3. **Runner:** запускає OpenCode-агента `i18n-audit`.
4. **Localization Skill:** перевіряє весь проєкт і виправляє однозначні проблеми локалізації.
5. **Зовнішня валідація:** після завершення агента запускається `validate-i18n.mjs`.
6. **Збереження SHA:** SHA зберігається лише після успішного аудиту та обов'язкових перевірок.

Watcher ігнорує Push-події, які існували до його запуску. Пропущені події не додаються в чергу та не обробляються повторно.

## 4. Файли та їх призначення

| Файл | Призначення |
|---|---|
| `.opencode/skills/i18n-localization-expert/SKILL.md` | Правила аудиту локалізації |
| `.opencode/agents/i18n-audit.md` | Конфігурація та права агента |
| `.opencode/watch-push.ps1` | Моніторинг Git Push |
| `.opencode/run-i18n-audit.ps1` | Запуск агента, перевірки та збереження SHA |
| `.opencode/validate-i18n.mjs` | Технічна перевірка локалізації |

Службові файли зберігаються локально:

```text
.git/opencode-i18n-audit/
├── audit.lock
├── last-processed-sha
└── audit-*.log
```

Ці файли належать до локального Git-сховища й не є частиною вихідного коду проєкту.

## 5. Перевірки локалізації

Зовнішній валідатор перевіряє:

- Коректність JSON.
- Синхронізацію ключів RU/UK.
- Цілісність плейсхолдерів.
- Цілісність HTML-тегів.
- Структуру ICU-повідомлень, якщо вони є.
- Структуру множинних форм `daily.reward` (три варіанти).

Ручний запуск перевірки:

```powershell
node .opencode\validate-i18n.mjs
```

Очікуваний результат:

```text
JSON validation: Passed
Key synchronization: Passed
Pluralization structure: Passed
Technical integrity: Passed
Final Status: Successful
```

Окрема runtime-перевірка множинних форм і повний набір тестів проєкту не запускаються.

## 6. Безпека та обмеження

- Підтримуються Push з будь-якої гілки.
- Обробляються лише нові успішні Push-події.
- Якщо файли локалізації мають незбережені зміни, аудит пропускається.
- Агент може редагувати лише `i18n/locales/ru.json` та `i18n/locales/uk.json`.
- Дані та схеми Supabase доступні лише для читання.
- Заборонені сторонній рефакторинг, зміни бізнес-логіки та UI.
- Заборонені Git commit, push, reset і checkout.
- Після помилки або переривання SHA не повинен вважатися обробленим.
- Успішно оброблений SHA пропускається для запобігання повторному аудиту.
- Перед запуском Runner перевіряє відповідність локального HEAD SHA відправленому коміту.

## 7. Логи та діагностика

Переглянути останній лог аудиту:

```powershell
$log = Get-ChildItem .git\opencode-i18n-audit\audit-*.log |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

Get-Content $log.FullName
```

Перевірити конфігурацію агента:

```powershell
opencode.cmd debug agent i18n-audit
```

Перевірити зміни Git:

```powershell
git status --short
```

Переглянути останні Push-події:

```powershell
git reflog show --all --date=iso --format="%gD|%gs|%H" |
Where-Object { $_ -match '^refs/remotes/.+@\{.+\}\|update by push\|' } |
Select-Object -First 10
```

**Важливо:** якщо watcher вимкнений, Push, виконані в цей час, не запустять аудит після наступного запуску watcher.