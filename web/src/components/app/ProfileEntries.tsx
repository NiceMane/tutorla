"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getRepo } from "@/lib/repo";
import type { EntryKind, ProfileEntry } from "@/lib/domain";
import { Collapse } from "@/components/ui/Collapse";
import { useToast } from "@/components/ui/Toast";

const KINDS: EntryKind[] = ["kulup", "proje", "yarisma", "gonullu", "sertifika", "deneyim", "basari"];
const ICON: Record<EntryKind, string> = {
  kulup: "🎭", proje: "🛠", yarisma: "🏅", gonullu: "🤝", sertifika: "📜", deneyim: "💼", basari: "⭐",
};
const BOS = { kind: "kulup" as EntryKind, title: "", org: "", description: "", startYear: "", endYear: "", url: "" };

/* Profilin "ders dışı" tarafı: kulüpler, projeler, yarışmalar, gönüllülük.
   Sabit alanlar yerine kaç tane olursa olsun eklenebilen girdiler — herkesin
   hikâyesi aynı kalıba sığmıyor. */
export function ProfileEntries({ userId }: { userId: string }) {
  const t = useTranslations("app.profile");
  const toast = useToast();
  const [list, setList] = useState<ProfileEntry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BOS);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await getRepo().listEntries(userId));
    } catch {
      setList([]);
    }
  }, [userId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const l = await getRepo().listEntries(userId);
        if (alive) setList(l);
      } catch {
        if (alive) setList([]);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  const input = "h-10 w-full rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary";
  const yil = (v: string) => (v.trim() === "" ? null : Number(v));

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !form.title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await getRepo().addEntry({
        kind: form.kind,
        title: form.title.trim(),
        org: form.org.trim() || null,
        description: form.description.trim() || null,
        startYear: yil(form.startYear),
        endYear: yil(form.endYear),
        url: form.url.trim() || null,
        position: 0,
      });
      setForm(BOS);
      setOpen(false);
      await load();
      toast(t("entrySave"));
    } catch (e2) {
      const m = e2 instanceof Error ? e2.message : "—";
      setErr(m);
      toast(m, "err");
    } finally {
      setBusy(false);
    }
  }

  async function sil(id: string) {
    setBusy(true);
    try {
      await getRepo().deleteEntry(id);
      await load();
      toast(t("entryDelete"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className="card flex flex-col gap-4 p-5">
      <legend className="meta px-1 text-[13.5px]">{t("entries")}</legend>
      <p className="meta -mt-2 text-[12.5px] leading-[1.45]">{t("entryHint")}</p>

      {list === null ? (
        <p className="meta text-[13.5px]">…</p>
      ) : list.length === 0 ? (
        <p className="meta text-[13.5px]">{t("entryEmpty")}</p>
      ) : (
        <ul className="stagger flex flex-col">
          {list.map((e, i) => (
            <li
              key={e.id}
              style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
              className="flex items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0"
            >
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[30%] border border-line bg-surface text-[15px]" aria-hidden="true">
                {ICON[e.kind]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <b className="text-[14.5px] font-semibold">{e.title}</b>
                  <span className="chip text-[11px]">{t(`entryKinds.${e.kind}`)}</span>
                  {(e.startYear || e.endYear) && (
                    <span className="meta text-[12.5px] tabular-nums">
                      {e.startYear ?? "?"}{e.endYear && e.endYear !== e.startYear ? `–${e.endYear}` : ""}
                    </span>
                  )}
                </span>
                {e.org && <span className="meta mt-0.5 block text-[13px]">{e.org}</span>}
                {e.description && <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-[1.5] text-ink-2">{e.description}</p>}
              </span>
              <button
                type="button" disabled={busy} onClick={() => void sil(e.id)}
                className="meta shrink-0 text-[12.5px] transition-colors hover:text-accent disabled:opacity-50"
              >
                {t("entryDelete")}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="btn btn-ghost h-9 text-[13.5px]">
          {open ? t("cancel") : t("entryAdd")}
        </button>
      </div>

      <Collapse open={open}>
        {/* İç içe form olmasın diye <form> değil: kaydetme düğmeye bağlı. */}
        <div className="grid gap-3 pt-2 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{t("entryKind")}</span>
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as EntryKind })} className={input}>
              {KINDS.map((k) => <option key={k} value={k}>{`${ICON[k]}  ${t(`entryKinds.${k}`)}`}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{t("entryTitle")}</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{t("entryOrg")}</span>
            <input value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} maxLength={100} className={input} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="meta text-[13px]">{t("entryStart")}</span>
              <input type="number" min={1990} max={2100} value={form.startYear}
                onChange={(e) => setForm({ ...form, startYear: e.target.value })} className={input} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="meta text-[13px]">{t("entryEnd")}</span>
              <input type="number" min={1990} max={2100} value={form.endYear}
                onChange={(e) => setForm({ ...form, endYear: e.target.value })} className={input} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="meta text-[13px]">{t("entryDesc")}</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} maxLength={600}
              className="resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 outline-none focus:border-primary" />
          </label>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="meta text-[13px]">{t("entryUrl")}</span>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} maxLength={300} placeholder="https://" className={input} />
          </label>
          {err && <p className="anim-shake text-[13.5px] text-accent md:col-span-2" role="alert">{err}</p>}
          <div className="md:col-span-2">
            <button type="button" onClick={ekle} disabled={busy || !form.title.trim()} className="btn btn-primary h-9 text-[14px] disabled:opacity-50">
              {t("entrySave")}
            </button>
          </div>
        </div>
      </Collapse>
    </fieldset>
  );
}
