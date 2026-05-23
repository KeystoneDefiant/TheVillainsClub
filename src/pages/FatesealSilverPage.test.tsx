import { MantineProvider } from "@mantine/core";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { useClubWallet } from "@/game/clubWalletStore";
import { isBarRouteState } from "@/game/barRouteState";
import { buildFatesealSettlementProfile } from "@/game/sessionSettlement";
import { buildClubTheme } from "@/theme/clubTheme";
import { FatesealSilverPage } from "./FatesealSilverPage";
import { diffDropInKeys } from "@/minigames/fateseal-silver/App";
import type { FatesealSymbolId } from "@/config/minigames/fatesealRules";

/** Surfaces the router `location.state` so the test can assert the
 *  settlement payload survived the cash-out → /bar redirect. */
function BarRouteProbe() {
  const { state } = useLocation();
  if (!isBarRouteState(state)) {
    return <div>Bar route (no settlement state)</div>;
  }
  return (
    <div>
      <span data-testid="bar-route-game">{state.lastTable.gameId}</span>
      <span data-testid="bar-route-return">{state.lastTable.totalReturn}</span>
    </div>
  );
}

function renderGameRoute() {
  return render(
    <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
      <MemoryRouter initialEntries={["/minigames/fateseal-silver"]}>
        <Routes>
          <Route path="/menu" element={<div>Menu fallback</div>} />
          <Route path="/bar" element={<BarRouteProbe />} />
          <Route path="/minigames/fateseal-silver" element={<FatesealSilverPage />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("FatesealSilverPage", () => {
  afterEach(() => {
    useClubWallet.getState().resetWalletAndSession();
    vi.restoreAllMocks();
  });

  it("redirects to /menu when there is no Fateseal session", () => {
    renderGameRoute();
    expect(screen.getByText("Menu fallback")).toBeInTheDocument();
  });

  it("returns to /bar with settlement state when cashing out", async () => {
    const buyIn = villainsGameDefaults.fatesealSilver.defaultBuyIn;
    /**
     * `prefers-reduced-motion` short-circuits the cascade animation timers,
     * letting the spin land in the ledger phase synchronously instead of
     * needing fake timers to tick through ~1s of overlay choreography.
     */
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    /** Deterministic RNG keeps cascade math reproducible for the cash-out path. */
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    act(() => {
      useClubWallet.getState().startSession({
        gameId: "fateseal_silver",
        drinkId: "fateseal_silver",
        buyIn,
        settlement: buildFatesealSettlementProfile(buyIn),
      });
    });

    renderGameRoute();

    /**
     * The Fateseal root mounts via React.lazy, which can take a few hundred
     * extra ms in the full suite (other lazy chunks compete for the same
     * Vite transform queue). Bump the timeout on the first interaction so
     * the test isn't flaky when other lazy pages load ahead of it.
     */
    fireEvent.click(await screen.findByTestId("fateseal-pick-dagger", {}, { timeout: 5000 }));
    fireEvent.click(await screen.findByTestId("fateseal-seal-prophecy"));
    fireEvent.click(await screen.findByTestId("fateseal-bet-min"));

    fireEvent.click(await screen.findByRole("button", { name: /cash out to club/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^confirm$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("bar-route-game")).toHaveTextContent("fateseal_silver");
    });
    expect(screen.queryByText("Menu fallback")).not.toBeInTheDocument();
    expect(useClubWallet.getState().activeSession).toBeNull();
  });
});

describe("diffDropInKeys", () => {
  it("includes cells where symbol changes", () => {
    const before: FatesealSymbolId[][] = [
      ["dagger", "chalice"],
      ["goat", "eye"],
    ];
    const after: FatesealSymbolId[][] = [
      ["dagger", "chalice"],
      ["serpent", "eye"],
    ];
    const result = diffDropInKeys(before, after);
    expect(result.has("0,0")).toBe(false);
    expect(result.has("1,0")).toBe(true); // goat -> serpent
  });

  it("includes cells above a matched/removed cell in the same column even if symbol is identical", () => {
    const before: FatesealSymbolId[][] = [
      ["dagger", "chalice"],
      ["goat", "eye"],
      ["goat", "moon"],
    ];
    const after: FatesealSymbolId[][] = [
      ["dagger", "chalice"],
      ["goat", "eye"],
      ["goat", "moon"],
    ];
    // Remove the bottom-most goat in column 0 (row 2)
    const removals = new Set(["2,0"]);
    const result = diffDropInKeys(before, after, removals);

    // In column 0, row 2 is matched, so rows 0, 1, 2 should all be included because they fall/shift down
    expect(result.has("0,0")).toBe(true);
    expect(result.has("1,0")).toBe(true);
    expect(result.has("2,0")).toBe(true);

    // Column 1 had no removals, so no cells in column 1 should be included
    expect(result.has("0,1")).toBe(false);
    expect(result.has("1,1")).toBe(false);
    expect(result.has("2,1")).toBe(false);
  });
});
