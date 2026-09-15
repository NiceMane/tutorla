"use client";
import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { useApp } from "@/lib/store";
import { Tour } from "./Tour";

/* Turu ilk girişte bir kez açar.
   Koşul render sırasında türetiliyor (etkide setState yok): tanışmayı
   bitirmiş, turu görmemiş ve sınav listesindeki bir kullanıcı. Liste sayfası
   şart çünkü turun ilk adımları oradaki kartı işaret ediyor. */
export function TourGate() {
  const { ready, profile } = useApp();
  const pathname = usePathname();
  const [kapandi, setKapandi] = useState(false);

  const uygun =
    ready && Boolean(profile?.onboardedAt) && !profile?.tourDoneAt && pathname === "/app";

  return <Tour open={uygun && !kapandi} onClose={() => setKapandi(true)} />;
}
