import { createContext, useContext, type ReactNode } from "react";
import { getCurrentGameMode, type GameModeConfig } from "@/config/minigames/oublietteNo9GameRules";

const OublietteGameModeContext = createContext<GameModeConfig | null>(null);

export function OublietteGameModeProvider({
  value,
  children,
}: {
  value: GameModeConfig;
  children: ReactNode;
}) {
  return <OublietteGameModeContext.Provider value={value}>{children}</OublietteGameModeContext.Provider>;
}

/** Resolved mode from the club session, or default normal mode when no provider (standalone / tests). */
export function useOublietteGameMode(): GameModeConfig {
  const ctx = useContext(OublietteGameModeContext);
  return ctx ?? getCurrentGameMode();
}
