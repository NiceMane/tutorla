import { ScriptedEngine } from "./scripted";
import { SocraticEngine } from "./socratic";
import type { StudentEngine } from "./types";
import type { SessionMode } from "@/lib/domain";

/* Tek değiştirme noktası: Claude motoru hazır olduğunda ikisi de ona döner.
   teach     → kullanıcı anlatır, AI öğrenci (ürünün çekirdeği)
   socratic  → AI sorar, kullanıcı düşünür */
export function getEngine(mode: SessionMode = "teach"): StudentEngine {
  return mode === "socratic" ? new SocraticEngine() : new ScriptedEngine();
}

export type { EngineContext, EngineTurn, StudentEngine } from "./types";
