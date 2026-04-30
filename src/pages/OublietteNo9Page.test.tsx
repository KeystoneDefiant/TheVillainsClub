import { MantineProvider } from "@mantine/core";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { useClubWallet } from "@/game/clubWalletStore";
import { buildOublietteSettlementProfile } from "@/game/sessionSettlement";
import { buildClubTheme } from "@/theme/clubTheme";
import { OublietteNo9Page } from "./OublietteNo9Page";

function renderGameRoute() {
  return render(
    <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
      <MemoryRouter initialEntries={["/minigames/oubliette-no9"]}>
        <Routes>
          <Route path="/menu" element={<div>Menu fallback</div>} />
          <Route path="/bar" element={<div>Bar route</div>} />
          <Route path="/minigames/oubliette-no9" element={<OublietteNo9Page />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("OublietteNo9Page", () => {
  afterEach(() => {
    useClubWallet.getState().resetWalletAndSession();
    vi.restoreAllMocks();
  });

  it("returns to the bar when the game-over action settles the active session", async () => {
    const buyIn = villainsGameDefaults.oublietteNo9.defaultBuyIn;
    act(() => {
      useClubWallet.getState().startSession({
        gameId: "oubliette_no9",
        drinkId: "house",
        buyIn,
        settlement: buildOublietteSettlementProfile(buyIn),
      });
      useClubWallet.getState().updateActiveSessionProgress({ progressRound: 31 });
    });

    renderGameRoute();

    fireEvent.click(await screen.findByRole("button", { name: /cash out and return to the club/i }));
    fireEvent.click(await screen.findByRole("button", { name: /confirm cash out/i }));
    fireEvent.click(await screen.findByRole("button", { name: /return to main menu/i }));

    expect(await screen.findByText("Bar route")).toBeInTheDocument();
    expect(screen.queryByText("Menu fallback")).not.toBeInTheDocument();
    expect(useClubWallet.getState().activeSession).toBeNull();
  });
});
