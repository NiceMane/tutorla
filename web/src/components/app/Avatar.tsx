"use client";
import Image from "next/image";
import type { Profile } from "@/lib/domain";

const SIZES = { sm: 32, md: 40, lg: 64, xl: 96 } as const;

/* Fotoğraf varsa onu, yoksa simgeyi gösterir. next/image ile optimize edilir. */
export function Avatar({
  profile, size = "md", className = "",
}: {
  profile: Pick<Profile, "avatarUrl" | "avatarEmoji" | "displayName"> | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  /* block şart: span varsayılanı inline ve inline kutuda width/height uygulanmaz —
     fotoğraflı avatar esnek satırın içinde dikey olarak uzuyordu. Emoji dalı
     zaten grid olduğu için bu hata yalnızca fotoğrafta görünüyordu. */
  const base = `block shrink-0 overflow-hidden rounded-[30%] border border-line bg-surface ${className}`;

  if (profile?.avatarUrl) {
    return (
      <span className={base} style={{ width: px, height: px }}>
        <Image
          src={profile.avatarUrl}
          alt={profile.displayName ?? ""}
          width={px}
          height={px}
          className="h-full w-full object-cover"
          unoptimized={profile.avatarUrl.startsWith("data:")}
        />
      </span>
    );
  }
  return (
    <span
      className={`grid place-items-center ${base}`}
      style={{ width: px, height: px, fontSize: Math.round(px * 0.5) }}
      aria-hidden="true"
    >
      {profile?.avatarEmoji || "🦉"}
    </span>
  );
}
