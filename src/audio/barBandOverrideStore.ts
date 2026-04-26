import { create } from "zustand";
import { activeBandIndexForBarDate } from "@/audio/barBandSchedule";
import { bandsCatalog } from "@/config/bandsCatalog";

type BarBandOverrideState = {
  /** When set, shell house band uses this catalog index instead of the bar-day hash. Dev / playground only. */
  eveningBandIndexOverride: number | null;
  setEveningBandIndexOverride: (index: number | null) => void;
};

export const useBarBandOverrideStore = create<BarBandOverrideState>((set) => ({
  eveningBandIndexOverride: null,
  setEveningBandIndexOverride: (index) => set({ eveningBandIndexOverride: index }),
}));

/** Band index for shell playback: optional override wins, else deterministic pick from bar date. */
export function effectiveBandIndexForBarDate(barDateKeyStr: string): number {
  const override = useBarBandOverrideStore.getState().eveningBandIndexOverride;
  if (
    override !== null &&
    Number.isInteger(override) &&
    override >= 0 &&
    override < bandsCatalog.bands.length
  ) {
    return override;
  }
  return activeBandIndexForBarDate(barDateKeyStr, bandsCatalog);
}
