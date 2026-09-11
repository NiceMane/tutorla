import { ScriptedEngine } from "./scripted";
import type { StudentEngine } from "./types";

/* Tek değiştirme noktası: Claude motoru hazır olduğunda burası ona döner. */
export function getEngine(): StudentEngine {
  return new ScriptedEngine();
}

export type { EngineContext, EngineTurn, StudentEngine } from "./types";
