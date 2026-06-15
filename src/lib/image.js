// 画像ファイルを Vision API 用に縮小して base64 を取り出す。
// 大きすぎる写真はトークン・転送量を食うので長辺 1568px に収める。
const MAX_EDGE = 1568;

export function fileToDisplayUrl(file) {
  return URL.createObjectURL(file);
}

export async function fileToBase64Scaled(file) {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const mediaType = "image/jpeg";
  const dataUrl = canvas.toDataURL(mediaType, 0.85);
  const base64 = dataUrl.split(",")[1];
  return { base64, mediaType, dataUrl };
}
