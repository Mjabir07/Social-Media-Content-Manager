/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");

const input = "public/brand/azmin-mark-v2-key.png";
const output = "public/brand/azmin-mark-v2.png";

async function main() {
  const source = sharp(input).ensureAlpha();
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
  let opaquePixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const distance = Math.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2);
    const alpha = Math.max(0, Math.min(1, (distance - 14) / 150));
    if (alpha <= 0) {
      data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0;
    } else {
      data[i] = Math.max(0, Math.min(255, Math.round((r - (1 - alpha) * 255) / alpha)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g / alpha)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round((b - (1 - alpha) * 255) / alpha)));
      data[i + 3] = Math.round(alpha * 255);
      if (data[i + 3] > 240) opaquePixels++;
    }
  }

  const trimmed = await sharp(data, { raw: info }).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp(trimmed)
    .resize(448, 448, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 32, bottom: 32, left: 32, right: 32, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(output);

  const result = sharp(output);
  const metadata = await result.metadata();
  const raw = await result.ensureAlpha().raw().toBuffer();
  const corners = [raw[3], raw[(metadata.width - 1) * 4 + 3], raw[(metadata.width * (metadata.height - 1)) * 4 + 3], raw[(metadata.width * metadata.height - 1) * 4 + 3]];
  console.log(JSON.stringify({ output, width: metadata.width, height: metadata.height, hasAlpha: metadata.hasAlpha, transparentCorners: corners.every((value) => value === 0), opaquePixels }));
}

main();
