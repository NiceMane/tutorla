"use client";
import { useSyncExternalStore } from "react";
import { useFormatter } from "next-intl";

const WEEK = 7 * 24 * 60 * 60 * 1000;

/* Dakikada bir tıklayan saat. Dışarıdan bir kaynağa abone olduğumuz için
   useSyncExternalStore doğru araç: render saf kalır, sunucuda "şimdi" yoktur. */
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};
/* Dakikaya yuvarlı: aynı dakika içinde hep aynı değer döner (React bunu şart koşar). */
const nowMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const noNow = () => null;

/* Tarihler kullanıcının diline göre biçimlenir. Öncesinde toLocaleDateString()
   dilsiz çağrılıyordu: Türkçe arayüzde "9/13/2026" görünüyordu.
   Sunucuda tam tarih basılır, istemcide son bir haftalık kayıtlar göreliye döner. */
export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const f = useFormatter();
  const date = new Date(iso);
  const now = useSyncExternalStore(subscribe, nowMinute, noNow);

  const relative = now !== null && now - date.getTime() < WEEK;
  /* Saat dakikaya yuvarlı olduğu için (ve sunucu saati tarayıcıdan birkaç
     saniye ileri olabildiği için) yeni bir kayıt "16 saniye sonra" diye
     gelecekte görünebiliyordu. Taban hiçbir zaman kaydın gerisinde kalmıyor. */
  const base = now === null ? 0 : Math.max(now, date.getTime());
  return (
    <span className={className} title={f.dateTime(date, { dateStyle: "long", timeStyle: "short" })}>
      {relative ? f.relativeTime(date, base) : f.dateTime(date, { dateStyle: "medium" })}
    </span>
  );
}
