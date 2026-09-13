/* Görsel işleme yardımcıları — hepsi tarayıcıda, sunucuya ham dosya gitmiyor.
   Telefonla çekilen 4 MB'lık bir kare, kırpıldıktan sonra ~80 KB'lık kareye iner:
   hem depolama hem de akışın açılma hızı için fark yaratıyor. */

export const MIME_PREFERRED = "image/webp";

/* WebP kodlamayı gerçekten yapabiliyor muyuz? (Safari 14'ten beri evet,
   ama emin olmadan kullanmak sessizce PNG'ye düşmek demek.) */
export function canEncodeWebp(): boolean {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    return c.toDataURL(MIME_PREFERRED).startsWith(`data:${MIME_PREFERRED}`);
  } catch {
    return false;
  }
}

export function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("gorsel-yuklenemedi"));
    img.src = src;
  });
}

export async function loadImageFromFile(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  const url = URL.createObjectURL(file);
  try {
    return { img: await loadImage(url), url };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

export function canvasToFile(canvas: HTMLCanvasElement, name: string, quality = 0.92): Promise<File> {
  const type = canEncodeWebp() ? MIME_PREFERRED : "image/jpeg";
  const ext = type === MIME_PREFERRED ? "webp" : "jpg";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("kare-cikarilamadi"));
        resolve(new File([blob], `${name}.${ext}`, { type }));
      },
      type,
      quality,
    );
  });
}

/* Akışa eklenen fotoğraflar için: en uzun kenarı sınırla, oranı koru. */
export async function shrinkImage(file: File, maxEdge = 1600, quality = 0.86): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const { img, url } = await loadImageFromFile(file);
  try {
    const edge = Math.max(img.naturalWidth, img.naturalHeight);
    if (edge <= maxEdge) return file;
    const k = maxEdge / edge;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * k);
    canvas.height = Math.round(img.naturalHeight * k);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = await canvasToFile(canvas, "foto", quality);
    /* Küçültme işe yaramadıysa (zaten iyi sıkıştırılmış JPEG) aslını gönder. */
    return out.size < file.size ? out : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* Panodan veya sürükle-bıraktan gelen ilk görseli çıkar. */
export function imageFromTransfer(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.files)) {
    if (item.type.startsWith("image/")) return item;
  }
  for (const item of Array.from(data.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

/* Kameradan gelen kareyi dosyaya çevir. Ön kamerada önizleme aynalı olduğu için
   kaydedilen kare de aynalanıyor: kullanıcı ne gördüyse o. */
export async function imageToFile(img: HTMLImageElement, mirrored = false, maxEdge = 1600): Promise<File> {
  const edge = Math.max(img.naturalWidth, img.naturalHeight);
  const k = edge > maxEdge ? maxEdge / edge : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * k);
  canvas.height = Math.round(img.naturalHeight * k);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("kare-cikarilamadi");
  if (mirrored) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvasToFile(canvas, "foto", 0.88);
}
