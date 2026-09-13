"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Gap, Message, Moment } from "@/lib/domain";
import { MomentChip } from "../MomentChip";

/* Sohbet akışı. Boşluk etiketi ve davranış anı, ait oldukları mesajın altında durur. */
export function MessageList({
  messages, thinking, gapFor, momentFor, firstGapId,
}: {
  messages: Message[];
  thinking: boolean;
  gapFor: (m: Message) => Gap | undefined;
  momentFor: (m: Message) => Moment | undefined;
  firstGapId: string | null;
}) {
  const t = useTranslations("app.session");
  const feed = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  return (
    <div ref={feed} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-[clamp(12px,2.5vw,20px)] py-4 text-[14px]">
      {messages.length === 0 && !thinking && <p className="meta m-auto max-w-[32ch] text-center">{t("empty")}</p>}

      {messages.map((m) => {
        const gap = gapFor(m);
        const moment = momentFor(m);
        return (
          <div key={m.id} className="flex flex-col gap-2">
            <div className={`max-w-[85%] rounded-[9px] px-3.5 py-2.5 leading-[1.5] ${m.role === "teacher" ? "self-end bg-primary text-on-primary" : "border border-line bg-surface-2"}`}>
              {/* curriculum'daki tek <strong> vurgusu için */}
              <span dangerouslySetInnerHTML={{ __html: m.content.replace(/<(?!\/?strong>)/g, "&lt;") }} />
            </div>
            {moment && <MomentChip kind={moment.kind} label={moment.label} />}
            {gap && (
              <>
                <div className="meta self-start rounded-[var(--radius-ui)] border border-dashed border-accent px-2.5 py-1 text-[13px] !text-accent">
                  {gap.label}
                </div>
                {/* Mekanizmayı yalnızca ilk boşlukta, tam görüldüğü anda söyle.
                    Her boşlukta tekrarlamak öğretici olmaktan çıkıp gürültü olur. */}
                {gap.id === firstGapId && (
                  <p className="meta self-start max-w-[46ch] text-[12.5px] leading-[1.45]">{t("mechanism")}</p>
                )}
              </>
            )}
          </div>
        );
      })}

      {thinking && <div className="meta self-start px-1 text-[13px]">{t("thinking")}</div>}
    </div>
  );
}
