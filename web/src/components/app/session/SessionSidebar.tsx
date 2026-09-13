"use client";
import { useTranslations } from "next-intl";
import type { Exam, Persona, Topic } from "@/lib/domain";

/* Sol koyu panel: hangi sınav, dersin konuları, kime anlatıyorsun. */
export function SessionSidebar({
  exam, subject, topicId, siblings, persona, percent,
}: {
  exam: Exam | null;
  subject: string;
  topicId: string | undefined;
  siblings: Topic[];
  persona: Persona | null;
  percent: number;
}) {
  const t = useTranslations("app.session");
  return (
    <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto bg-deep p-4 text-[13px] text-deep-ink lg:flex">
      <div className="flex flex-col gap-2">
        <span className="meta text-[13px] !text-deep-mute">{t("exam")}</span>
        <div className="flex flex-wrap gap-1.5">
          <span className="chip !border-deep-primary !bg-deep-primary !text-deep px-2 py-1 text-[11.5px]">
            {exam?.code ?? "—"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="meta mb-1 text-[13px] !text-deep-mute">{subject.toLocaleLowerCase("tr")}</span>
        {siblings.map((x) => {
          const on = x.id === topicId;
          return (
            <div
              key={x.id}
              className={`flex justify-between rounded-[var(--radius-ui)] px-2 py-1.5 ${on ? "bg-deep-2 font-semibold text-white" : "text-deep-mute"}`}
            >
              <span className="truncate">{x.name}</span>
              {on && <span className="meta text-[13px] !text-deep-accent tabular-nums">{percent}</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <span className="meta text-[13px] !text-deep-mute">{t("student")}</span>
        <div className="flex gap-1.5">
          <i className="block size-8 rounded-[30%] border-2 border-deep-primary bg-[repeating-linear-gradient(135deg,var(--deep-2)_0_4px,var(--deep)_4px_8px)]" />
        </div>
        <span className="meta text-[12.5px] !text-deep-mute">
          {persona?.name} · {persona?.trait.split(",")[0].toLocaleLowerCase("tr")}
        </span>
      </div>
    </aside>
  );
}
