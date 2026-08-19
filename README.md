# health-fit-release.2.0

Персональний застосунок відновлення здоров'я: щоденні завдання трьох типів
(їжа / ментальне / фізичне), тижневі завдання, журнал настрою з графіком,
вхідний скринінг.

Один і той самий код працює і як веб-застосунок, і як мобільний — під iOS та
Android через Capacitor.

## Передумови

**Node 26** — версія зафіксована в `.nvmrc`. Це не побажання: на Node 18
(типовий дефолт `nvm` на машині) збірка падає з оманливими помилками на кшталт
`does not provide an export named 'styleText'`, які не мають до реальної
причини жодного стосунку.

```bash
nvm use && npm ci
```

**`.env` обов'язковий**, у репозиторії його немає:

```
SUPABASE_URL=...
SUPABASE_KEY=...
```

Без нього застосунок падає з `Cannot read properties of undefined (reading 'state')`
у стеку `@pinia/nuxt` — симптом теж оманливий, до pinia проблема стосунку не має.

## Веб

```bash
npm run dev
```

---

# Мобільна версія

## На чому працює

Нативного коду в проєкті немає. Nuxt збирається в **статичну SPA**
(`ssr: false`), а **Capacitor** кладе цю статику в нативний контейнер і
показує у системному WebView — `WKWebView` на iOS, Android WebView на Android.

Сервера всередині застосунку немає і бути не може: WebView вміє показувати
файли, а не виконувати Node. Тому Supabase застосунок смикає напряму по HTTPS,
так само як веб-версія.

| | |
|---|---|
| Capacitor | 8.5 (`@capacitor/core`, `@capacitor/cli`) |
| Що потрапляє в застосунок | `.output/public` — результат `nuxt generate` |
| Ідентифікатор пакета | `com.healthfit.app` |
| Назва | Health Fit |
| iOS | deployment target 15.0, залежності через Swift Package Manager |
| Android | `minSdk` 24, `compileSdk`/`targetSdk` 36, AGP 8.13, Gradle 8.14.3 |

Походження сторінки всередині WebView — `capacitor://localhost` на iOS і
`https://localhost` на Android. Це важливо пам'ятати: відносні URL до власного
API працювати не будуть, і саме ці походження треба вносити в CORS, коли
з'явиться свій бекенд.

**CocoaPods не потрібен.** Capacitor 8 збирає iOS через Swift Package Manager —
`Podfile` у проєкті немає і не буде.

## Тулчейн

### iOS

Потрібен **повний Xcode** (не Command Line Tools). Після встановлення з App Store
— чотири кроки, перші три під `sudo`:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

```bash
sudo xcodebuild -license accept
```

```bash
sudo xcodebuild -runFirstLaunch
```

```bash
xcodebuild -downloadPlatform iOS
```

Останній крок легко пропустити, а без нього нічого не запуститься: Xcode
приносить **SDK для збірки**, але не **образ системи для симулятора**. Це різні
речі й качаються окремо. Те саме через GUI: Xcode → Settings → Components → iOS.

Перевірити, що все стало:

```bash
xcode-select -p && xcrun simctl list runtimes
```

### Android

Нативний проєкт згенерований і лежить у `android/`, але **на цій машині
тулчейн не встановлений, і збірка під Android жодного разу не запускалась**.
Знадобиться Android Studio з SDK; для Gradle з CLI — окремий JDK 17+.

```bash
brew install --cask android-studio
```

## Локальна розробка

Циклів два, і більшість часу потрібен перший.

### 1. У браузері — швидкий цикл

```bash
npm run dev
```

Уся звичайна робота над інтерфейсом робиться тут: миттєвий HMR, нормальні
DevTools. Симулятор для цього не потрібен.

### 2. У симуляторі з live-reload — для нативної поведінки

Потрібен тоді, коли треба перевірити те, чого браузер не відтворює: поведінку
клавіатури, splash-екран, безпечні зони, особливості WebView.

Спочатку в одному терміналі підняти dev-сервер:

```bash
npm run dev
```

Потім у другому — задеплоїти застосунок так, щоб він тягнув код із цього
сервера, а не з бандла:

```bash
npx cap run ios --live-reload --host localhost --port 3000
```

Застосунок збереться, встановиться в симулятор і буде перемальовуватись на
кожну зміну у файлах. Ознака, що все підключилось правильно — унизу екрана
з'явиться бейдж Nuxt DevTools.

Якщо порт зайнятий іншим проєктом, підніми dev-сервер на іншому і передай той
самий номер у `--port`. Конкретний симулятор вибирається через `--target <UDID>`,
список — `xcrun simctl list devices available`.

> Після сесії live-reload у `ios/App/App/capacitor.config.json` лишається
> `server.url`, що вказує на dev-сервер. Файл гітігнорений, тож у коміт не
> потрапить, але застосунок у симуляторі далі дивитиметься в мережу. Прибирається
> звичайним `npm run mobile:sync`.

## Збірка

Будь-яка зміна у фронтенді потрапляє в нативний проєкт тільки через синхронізацію:

```bash
npm run mobile:sync
```

Це `nuxt generate` плюс `cap sync` — статика збирається і копіюється в
`ios/App/App/public` та `android/app/src/main/assets/public`. **Без цього кроку
нативна збірка залишиться зі старим кодом.**

### iOS

Відкрити проєкт в Xcode (синхронізація виконається автоматично):

```bash
npm run mobile:ios
```

Далі збірка й запуск звичайним способом — ⌘R. Для симулятора підпис не потрібен.

Те саме без Xcode, з командного рядка:

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 17' build
```

Перша збірка займає близько хвилини, наступні — секунди.

### Android

```bash
npm run mobile:android
```

Відкриє проєкт в Android Studio. Не перевірялось — див. розділ про тулчейн.

### Реліз

Збірка під стори **ще не налаштована**. Для iOS знадобиться акаунт Apple
Developer і сертифікати підпису; зараз у проєкті немає ні того, ні іншого, тож
`Archive` не пройде. Для Android — keystore і підписаний AAB.

## Іконка і splash-екран

Обидві картинки генеруються з логотипа `app/assets/main-logo.png`, руками нічого
малювати не треба:

```bash
npm run assets:build
```

Скрипт `scripts/generateAppAssets.mjs` ріже з логотипа вихідні зображення в
`assets/`, далі `capacitor-assets` розкладає їх по всіх потрібних розмірах для
обох платформ. Розміри, відступи й кольори налаштовуються константами вгорі
скрипта.

Для іконки береться тільки знак без напису — текст на 60×60 точках нечитабельний.
Для splash — повний логотип; у темному варіанті знову лише знак, бо темні літери
на темному фоні зникають.

## Корисне

| Команда | Що робить |
|---|---|
| `npm run dev` | dev-сервер |
| `npm run generate` | статична збірка в `.output/public` |
| `npm run mobile:sync` | зібрати статику і скопіювати в нативні проєкти |
| `npm run mobile:ios` | синхронізувати і відкрити Xcode |
| `npm run mobile:android` | синхронізувати і відкрити Android Studio |
| `npm run assets:build` | перегенерувати іконку і splash |
