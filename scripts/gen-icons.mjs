// public/icon.svg から PWA 用 PNG アイコンを生成する。
// 実行: node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

const baseSvg = readFileSync(join(pub, "icon.svg"));

// マスカブル用：全面背景＋セーフゾーン内にロゴ（外周がトリミングされても欠けない）
const maskableSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1f25"/>
      <stop offset="1" stop-color="#2d5560"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(0.74) translate(-256 -256)">
    <circle cx="256" cy="256" r="150" fill="none" stroke="#d69d66" stroke-width="16"/>
    <path d="M196 348 L196 176 L286 176 Q352 176 352 244 Q352 312 286 312 L196 312"
      fill="none" stroke="#ffffff" stroke-width="28"
      stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`);

const jobs = [
  { svg: baseSvg, size: 192, out: "icon-192.png" },
  { svg: baseSvg, size: 512, out: "icon-512.png" },
  { svg: maskableSvg, size: 512, out: "icon-maskable-512.png" },
];

for (const j of jobs) {
  await sharp(j.svg, { density: 384 })
    .resize(j.size, j.size)
    .png()
    .toFile(join(pub, j.out));
  console.log("generated", j.out);
}
