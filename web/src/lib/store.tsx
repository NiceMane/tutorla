"use client";
/* Repo'yu React'e bağlayan ince katman. Repo değişince (Supabase) burası aynı kalır. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getRepo, type Curriculum } from "@/lib/repo";
import type { Exam, Persona, Profile, TopicProgress } from "@/lib/domain";

type AppState = {
  ready: boolean;
  curriculum: Curriculum;
  personas: Persona[];
  progress: Map<string, TopicProgress>;
  profile: Profile | null;
  exams: Exam[];
  refresh: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshExams: () => Promise<void>;
  refreshCurriculum: () => Promise<void>;
  reset: () => Promise<void>;
};

const emptyCurriculum: Curriculum = { subjects: [], topics: [], concepts: [] };
const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepo(), []);
  const [ready, setReady] = useState(false);
  const [curriculum, setCurriculum] = useState<Curriculum>(emptyCurriculum);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [progress, setProgress] = useState<Map<string, TopicProgress>>(new Map());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);

  const refresh = useCallback(async () => {
    const p = await repo.getProgress();
    setProgress(new Map(p.map((x) => [x.topicId, x])));
  }, [repo]);

  const refreshProfile = useCallback(async () => {
    setProfile(await repo.getMyProfile());
  }, [repo]);

  const refreshExams = useCallback(async () => {
    setExams(await repo.listExams());
  }, [repo]);

  /* Kendi sınavına ders/konu ekleyince müfredat ağacı tazelenmeli.
     Eskiden bunun yerine sayfa baştan yükleniyordu: kaydırma kayboluyor,
     onay mesajı da doğduğu anda ölüyordu. */
  const refreshCurriculum = useCallback(async () => {
    setCurriculum(await repo.getCurriculum());
  }, [repo]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [c, ps, pr, me, ex] = await Promise.all([
        repo.getCurriculum(), repo.getPersonas(), repo.getProgress(), repo.getMyProfile(), repo.listExams(),
      ]);
      if (!alive) return;
      setCurriculum(c);
      setPersonas(ps);
      setProgress(new Map(pr.map((x) => [x.topicId, x])));
      setProfile(me);
      setExams(ex);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [repo]);

  const reset = useCallback(async () => {
    await repo.reset?.();
    await refresh();
  }, [repo, refresh]);

  const value = useMemo<AppState>(
    () => ({ ready, curriculum, personas, progress, profile, exams, refresh, refreshProfile, refreshExams, refreshCurriculum, reset }),
    [ready, curriculum, personas, progress, profile, exams, refresh, refreshProfile, refreshExams, refreshCurriculum, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp, AppProvider içinde çağrılmalı");
  return v;
}
