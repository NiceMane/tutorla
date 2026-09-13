"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { UnderstandingMap } from "./UnderstandingMap";
import { TeachingEvidence } from "./TeachingEvidence";
import { useSession } from "./session/useSession";
import { SessionSidebar } from "./session/SessionSidebar";
import { MessageList } from "./session/MessageList";
import { Composer } from "./session/Composer";
import { MobileMap } from "./session/MobileMap";

/* Seans ekranının yerleşimi. Durum useSession'da, parçalar session/ altında;
   burada yalnızca üç kolon kuruluyor. */
export function SessionScreen({ sessionId }: { sessionId: string }) {
  const t = useTranslations("app.session");
  const tn = useTranslations("app.nav");
  const s = useSession(sessionId);

  if (s.missing) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper p-6 text-center">
        <div>
          <p className="text-ink-2">{t("missing")}</p>
          <Link href="/app" className="btn btn-ghost mt-4">{tn("back")}</Link>
        </div>
      </div>
    );
  }

  const map = (showHeader = true) => (
    <UnderstandingMap
      topicName={s.topic?.name ?? ""}
      concepts={s.concepts}
      states={s.stateMap}
      closed={s.closedByTeaching}
      targetId={s.targetId}
      percent={s.percent}
      settled={s.settled}
      asked={s.asked}
      note={s.detail?.session.note ?? null}
      showHeader={showHeader}
    />
  );

  return (
    <div className="flex h-dvh flex-col bg-paper">
      {/* üst şerit */}
      <header className="flex h-[56px] shrink-0 items-center gap-3 border-b border-line px-[clamp(12px,2.5vw,20px)]">
        <Link href="/app" className="flex items-center gap-2 text-ink-2 hover:text-ink" aria-label={tn("back")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          <Wordmark className="h-5 w-auto" />
        </Link>
        <span className="chip ml-2 hidden !border-accent/50 !text-accent sm:inline-flex" title={t("scriptedHint")}>
          {t("scripted")}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {!s.finished && s.detail && s.detail.messages.length > 1 && (
            <button type="button" onClick={s.finish} className="btn btn-ghost h-9 px-3 text-[13.5px]">{t("finish")}</button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[212px_minmax(0,1fr)_262px]">
        <SessionSidebar
          exam={s.exam}
          subject={s.subject?.name ?? ""}
          topicId={s.topic?.id}
          siblings={s.siblings}
          persona={s.persona}
          percent={s.percent}
        />

        {/* orta: sohbet */}
        <main className="flex min-h-0 min-w-0 flex-col">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-[clamp(12px,2.5vw,20px)] py-3">
            <div>
              <h1 className="text-[19px]">{s.topic?.name}</h1>
              <span className="meta text-[13.5px]">
                {(s.exam?.code ?? "").toLocaleLowerCase("tr")} / {s.subject?.name.toLocaleLowerCase("tr")} · {s.persona?.name}
              </span>
            </div>
            <span className="meta flex items-center gap-1.5 text-[13.5px] !text-primary">
              <i className="block size-1.5 rounded-full bg-primary" />{s.settled}/{s.concepts.length}
            </span>
          </div>

          <MobileMap percent={s.percent}>{map(false)}</MobileMap>

          <MessageList
            messages={s.detail?.messages ?? []}
            thinking={s.thinking}
            gapFor={s.gapForMessage}
            momentFor={s.momentForMessage}
            firstGapId={s.firstGapId}
          />

          {s.finished ? (
            <div className="shrink-0 border-t border-line px-[clamp(12px,2.5vw,20px)] py-4">
              <p className="text-[14px] text-ink-2"><span className="meta">{t("noteLabel")}</span> {s.detail?.session.note}</p>
              <Link href="/app" className="btn btn-primary mt-3 h-9 text-[14px]">{tn("back")}</Link>
            </div>
          ) : (
            <Composer
              draft={s.draft}
              setDraft={s.setDraft}
              thinking={s.thinking}
              sendErr={s.sendErr}
              onSend={s.send}
            />
          )}
        </main>

        {/* sağ: anlayış haritası (masaüstü) */}
        <aside className="hidden min-h-0 flex-col gap-5 overflow-y-auto border-l border-line p-4 lg:flex">
          {map()}
          {s.mode === "teach" && (
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <span className="meta text-[13.5px]">{t("moments")}</span>
              <TeachingEvidence counts={s.momentCounts} />
              <p className="meta mt-1 text-[12.5px] leading-[1.45]">{t("momentsHint")}</p>
            </div>
          )}
          {/* İki katmanın ilişkisini bir cümleyle söyle: üstte ne öğrendiğin,
              altta nasıl öğrettiğin. Biri diğerinin yerine geçmiyor. */}
          {s.mode === "teach" && <p className="meta border-t border-line pt-3 text-[12.5px] leading-[1.45]">{t("twoLayers")}</p>}
        </aside>
      </div>
    </div>
  );
}
