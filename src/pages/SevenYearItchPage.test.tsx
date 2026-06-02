import { MantineProvider } from "@mantine/core";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { useClubWallet } from "@/game/clubWalletStore";
import { isBarRouteState } from "@/game/barRouteState";
import { buildSevenYearItchSettlementProfile } from "@/game/sessionSettlement";
import { buildClubTheme } from "@/theme/clubTheme";
import { SevenYearItchPage } from "./SevenYearItchPage";
import { useBarBandOverrideStore } from "@/audio/barBandOverrideStore";

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
      <MemoryRouter initialEntries={["/minigames/seven-year-itch"]}>
        <Routes>
          <Route path="/menu" element={<div>Menu fallback</div>} />
          <Route path="/bar" element={<BarRouteProbe />} />
          <Route path="/minigames/seven-year-itch" element={<SevenYearItchPage />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("SevenYearItchPage", () => {
  beforeEach(() => {
    useBarBandOverrideStore.getState().setEveningBandIndexOverride(0);
  });

  afterEach(() => {
    useClubWallet.getState().resetWalletAndSession();
    useBarBandOverrideStore.getState().setEveningBandIndexOverride(null);
    vi.restoreAllMocks();
  });

  it("redirects to /menu when there is no 7 Year Itch session", () => {
    renderGameRoute();
    expect(screen.getByText("Menu fallback")).toBeInTheDocument();
  });

  it("returns to /bar with settlement state when cashing out before any rolls", async () => {
    const buyIn = villainsGameDefaults.sevenYearItch.defaultBuyIn;
    act(() => {
      useClubWallet.getState().startSession({
        gameId: "seven_year_itch",
        drinkId: "seven_year_itch",
        buyIn,
        settlement: buildSevenYearItchSettlementProfile(buyIn),
      });
    });

    renderGameRoute();

    /**
     * Cashing out with no point active uses the early-settlement path that
     * the existing 7YI app-test exercises. We then assert the route landed on
     * /bar with `BarRouteState` populated — guarding against the redirect
     * race that the `isReturningToClubRef` change fixes.
     *
     * The 7YI root is loaded via React.lazy, so the first findBy gets an
     * extended timeout to avoid flakes when the full suite races on Vite
     * transforms.
     */
    fireEvent.click(await screen.findByRole("button", { name: /cash out/i }, { timeout: 8000 }));
    fireEvent.click(await screen.findByRole("button", { name: /confirm cash out/i }));

    await waitFor(() => {
      expect(screen.getByTestId("bar-route-game")).toHaveTextContent("seven_year_itch");
    });
    /** Buy-in returned in full because the player never rolled (capped at buy-in). */
    expect(screen.getByTestId("bar-route-return")).toHaveTextContent(String(buyIn));
    expect(screen.queryByText("Menu fallback")).not.toBeInTheDocument();
    expect(useClubWallet.getState().activeSession).toBeNull();
  }, 12000);
});
