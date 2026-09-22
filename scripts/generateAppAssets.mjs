// Збирає вихідні картинки для іконки застосунку та splash-екрана з логотипа
// `app/assets/main-logo.png`, а далі їх розкладає по нативних проєктах
// `npx capacitor-assets generate`.
//
// Логотип — горизонтальний лок-ап: знак (серце з листком) і напис. Для іконки
// потрібен лише знак: напис на 60×60 точках нечитабельний. Координати розрізу
// не вгадані — між знаком і написом у логотипі є смуга з 30 повністю прозорих
// колонок, по ній і ріжемо.
//
// Запуск: npm run assets:build

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(root, "app/assets/main-logo.png");
const OUT = resolve(root, "assets");

// Межі в системі координат main-logo.png (680×282).
const MARK = { left: 1, top: 1, width: 264, height: 280 };
const LOCKUP = { left: 1, top: 1, width: 675, height: 280 };

// --white і --black1 з app/assets/colors.css
const LIGHT = "#ffffff";
const DARK = "#1d1d1f";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// У main-logo.png по всій рамці залитий ледь помітний ореол — 54% пікселів
// мають альфу 1..31 (у середньому rgba(109,166,138,6)). На вебі його не
// видно, бо логотип малий, а от розтягнутий на splash він дає навколо
// логотипа сіру коробку. Сама графіка сидить в альфі 128..255, згладжування
// країв — у 32..127, тому поріг на 32 прибирає ореол і не чіпає нічого
// потрібного.
const ALPHA_FLOOR = 32;

/** Логотип із вичищеним ореолом — саме з нього ріжемо всі шматки. */
async function cleanLogo() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < ALPHA_FLOOR) data[i] = 0;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

const LOGO = await cleanLogo();

/** Порожнє полотно заданого розміру й кольору. */
function canvas(size, background) {
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  });
}

/**
 * Вирізає шматок логотипа і вписує його у квадрат зі стороною `box`.
 *
 * `trim` обрізає прозорі поля вже після чистки ореолу: межі нижче задані
 * приблизно, і без обрізки залишок порожнього поля з одного боку зсував би
 * знак від оптичного центру.
 */
async function piece(region, box) {
  return sharp(LOGO)
    .extract(region)
    .trim({ threshold: 0 })
    .resize({ width: box, height: box, fit: "inside" })
    .png()
    .toBuffer();
}

/**
 * Знак/лок-ап по центру полотна.
 *
 * `keepAlpha` лишається тільки для переднього шару Android-адаптиву — там
 * прозорість обов'язкова. Решті вона шкодить: iOS не приймає іконки з
 * альфа-каналом, App Store Connect відхиляє такі збірки на завантаженні.
 */
async function compose({ region, size, coverage, background, file, keepAlpha = false }) {
  const inner = await piece(region, Math.round(size * coverage));
  const out = canvas(size, background).composite([
    { input: inner, gravity: "centre" },
  ]);
  await (keepAlpha ? out : out.flatten({ background }).removeAlpha())
    .png()
    .toFile(resolve(OUT, file));
  console.log("✔", file);
}

await mkdir(OUT, { recursive: true });

// Іконка: знак займає 60% полотна — типовий відступ для iOS-іконки.
// Прозорості бути не може, iOS її не приймає, тому фон суцільний білий.
await compose({
  region: MARK,
  size: 1024,
  coverage: 0.6,
  background: LIGHT,
  file: "icon.png",
});

// Android adaptive icon: система обрізає передній шар до кола/скруглення,
// у безпечну зону влазить лише ~66% діаметра — тому знак дрібніший, ніж
// на звичайній іконці, а фон окремим шаром.
await compose({
  region: MARK,
  size: 1024,
  coverage: 0.45,
  background: TRANSPARENT,
  file: "icon-foreground.png",
  keepAlpha: true,
});
await canvas(1024, LIGHT)
  .flatten({ background: LIGHT })
  .removeAlpha()
  .png()
  .toFile(resolve(OUT, "icon-background.png"));
console.log("✔ icon-background.png");

// Splash: Capacitor масштабує картинку «на заповнення» і обрізає під
// співвідношення сторін конкретного екрана, тому вміст тримаємо дрібним
// і строго по центру — інакше на вузьких екранах його зріже.
await compose({
  region: LOCKUP,
  size: 2732,
  coverage: 0.3,
  background: LIGHT,
  file: "splash.png",
});

// Темна тема: у лок-апі «Fit» і «Release» набрані темним, на темному фоні
// вони просто зникають. Тому в темному варіанті лишається сам знак — він
// зелений і читається на будь-якому фоні.
await compose({
  region: MARK,
  size: 2732,
  coverage: 0.18,
  background: DARK,
  file: "splash-dark.png",
});
