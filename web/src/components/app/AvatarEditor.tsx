"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getRepo } from "@/lib/repo";
import { imageFromTransfer, loadImage, loadImageFromFile } from "@/lib/image";
import { Modal } from "@/components/ui/Modal";
import { ImageCropper } from "@/components/media/ImageCropper";
import { CameraCapture } from "@/components/media/CameraCapture";

const MAX_INPUT = 12 * 1024 * 1024; // kırpmadan ÖNCEki sınır; çıktı zaten ~100 KB

type Step = "source" | "camera" | "crop";

/* Profil fotoğrafının tüm yolu tek yerde: dosya seç, sürükle bırak, yapıştır,
   kameradan çek → kırp → yükle. Eskiden yalnızca "dosya seç" vardı ve gelen
   kare ne ise o yükleniyordu; yatay bir fotoğraf avatarda ortasından kesiliyordu. */
export function AvatarEditor({
  open, onClose, currentUrl, onUploaded, onRemoved,
}: {
  open: boolean;
  onClose: () => void;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}) {
  const t = useTranslations("media");
  const [step, setStep] = useState<Step>("source");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [mirrored, setMirrored] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Kapanış tek kapıdan geçiyor: hem düğme hem Esc hem de yükleme sonrası.
     Böylece temizlik için "open false oldu" etkisine gerek kalmıyor. */
  const close = useCallback(() => {
    setStep("source");
    setImg(null);
    setMirrored(false);
    setErr(null);
    setDragging(false);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    onClose();
  }, [objectUrl, onClose]);

  /* Sökülürken kalan blob adresini bırak. */
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);

  const takeFile = useCallback(async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr(t("notImage"));
    if (file.size > MAX_INPUT) return setErr(t("tooBig"));
    setErr(null);
    try {
      const { img: loaded, url } = await loadImageFromFile(file);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl(url);
      setImg(loaded);
      setMirrored(false);
      setStep("crop");
    } catch {
      setErr(t("notImage"));
    }
  }, [objectUrl, t]);

  /* Panodan yapıştırma: ekran görüntüsünü doğrudan avatar yapabilmek için. */
  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const f = imageFromTransfer(e.clipboardData);
      if (f) { e.preventDefault(); void takeFile(f); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, takeFile]);

  /* Mevcut fotoğrafı yeniden çerçevele. Depolama CORS'a izin vermezse
     tuval "kirlenir" ve dışa aktarma patlar; o yüzden baştan kontrol ediyoruz. */
  async function editCurrent() {
    if (!currentUrl) return;
    setErr(null);
    try {
      const loaded = await loadImage(currentUrl, true);
      setImg(loaded);
      setMirrored(false);
      setStep("crop");
    } catch {
      setErr(t("cantEditCurrent"));
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const url = await getRepo().uploadAvatar(file);
      onUploaded(url);
      close();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "—");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await getRepo().removeAvatar();
      onRemoved();
      close();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "—");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title={t("photoTitle")} wide={step !== "source"}>
      <input
        ref={fileRef} type="file" accept="image/*" hidden
        onChange={(e) => { void takeFile(e.target.files?.[0] ?? null); if (fileRef.current) fileRef.current.value = ""; }}
      />

      {step === "source" && (
        <div className="anim-fade-up flex flex-col gap-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); void takeFile(imageFromTransfer(e.dataTransfer)); }}
            className={`flex flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed px-5 py-8 text-center transition-colors duration-200 ${
              dragging ? "border-primary bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]" : "border-line-2"
            }`}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-200 ${dragging ? "scale-110 text-primary" : "text-ink-3"}`}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
            </svg>
            <p className="text-[14.5px] font-medium">{t("dropHere")}</p>
            <p className="meta max-w-[34ch] text-[12.5px]">{t("dropHint")}</p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-primary h-9 text-[13.5px]">{t("chooseFile")}</button>
              <button type="button" onClick={() => { setErr(null); setStep("camera"); }} className="btn btn-ghost h-9 gap-1.5 text-[13.5px]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                </svg>
                {t("useCamera")}
              </button>
            </div>
          </div>

          {currentUrl && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <button type="button" onClick={editCurrent} className="btn btn-ghost h-9 text-[13.5px]">{t("reframe")}</button>
              <button type="button" onClick={remove} disabled={busy} className="btn btn-ghost h-9 text-[13.5px] !text-accent disabled:opacity-60">{t("removePhoto")}</button>
            </div>
          )}
        </div>
      )}

      {step === "camera" && (
        <div className="anim-fade-up flex flex-col gap-4">
          <CameraCapture
            onCapture={(captured, mir) => { setImg(captured); setMirrored(mir); setStep("crop"); }}
          />
          <button type="button" onClick={() => setStep("source")} className="btn btn-ghost mx-auto h-9 text-[13.5px]">{t("back")}</button>
        </div>
      )}

      {step === "crop" && img && (
        <div className="anim-fade-up flex flex-col gap-4">
          <ImageCropper img={img} mirrored={mirrored} busy={busy} onDone={(f) => void upload(f)} />
          <button type="button" onClick={() => setStep("source")} disabled={busy} className="btn btn-ghost mx-auto h-9 text-[13.5px] disabled:opacity-60">{t("back")}</button>
        </div>
      )}

      {err && <p className="anim-fade-in mt-4 text-center text-[13.5px] text-accent" role="alert">{err}</p>}
    </Modal>
  );
}
