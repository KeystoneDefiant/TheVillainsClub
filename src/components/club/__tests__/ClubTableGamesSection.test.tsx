import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { useClubWallet } from "@/game/clubWalletStore";
import { buildOublietteSettlementProfile, buildSevenYearItchSettlementProfile } from "@/game/sessionSettlement";
import { buildClubTheme } from "@/theme/clubTheme";
import { ClubTableGamesSection } from "../ClubTableGamesSection";

function renderSection() {
  return render(
    <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark">
      <MemoryRouter initialEntries={["/bar"]}>
        <Routes>
          <Route path="/bar" element={<ClubTableGamesSection />} />
          <Route path="/minigames/oubliette-no9" element={<div data-testid="in-game">in game</div>} />
          <Route path="/minigames/seven-year-itch" element={<div data-testid="in-7yi">7yi</div>} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("ClubTableGamesSection", () => {
  beforeEach(() => {
    useClubWallet.setState({
      clubBalance: villainsGameDefaults.defaultClubBalance,
      activeSession: null,
      hasSave: false,
    });
  });

  it("shows club balance and tables label", () => {
    renderSection();
    expect(screen.getByText("Club balance", { exact: true })).toBeInTheDocument();
    expect(
      screen.getByText(`${villainsGameDefaults.defaultClubBalance.toLocaleString()} credits`),
    ).toBeInTheDocument();
    expect(screen.getByText("Tables", { exact: true })).toBeInTheDocument();
  });

  it("navigates to minigame when start succeeds", () => {
    renderSection();
    fireEvent.click(screen.getByRole("button", { name: /oubliette no\. 9 \(table\)/i }));
    expect(screen.getByTestId("in-game")).toBeInTheDocument();
  });

  it("shows resume when an Oubliette session is already open", () => {
    const buyIn = villainsGameDefaults.oublietteNo9.defaultBuyIn;
    useClubWallet.setState({
      clubBalance: villainsGameDefaults.defaultClubBalance,
      activeSession: {
        gameId: "oubliette_no9",
        drinkId: "club_table",
        buyIn,
        sessionWallet: buyIn,
        settlement: buildOublietteSettlementProfile(buyIn),
      },
    });

    renderSection();
    expect(screen.getByRole("button", { name: /resume oubliette/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /oubliette no\. 9 \(table\)/i })).toBeDisabled();
  });

  it("disables start when balance is below buy-in", () => {
    useClubWallet.setState({
      clubBalance: villainsGameDefaults.oublietteNo9.defaultBuyIn - 1,
      activeSession: null,
    });
    renderSection();
    expect(screen.getByRole("button", { name: /oubliette no\. 9 \(table\)/i })).toBeDisabled();
  });

  it("navigates to 7 Year Itch when start succeeds", () => {
    renderSection();
    fireEvent.click(screen.getByRole("button", { name: /7 year itch \(crapless\)/i }));
    expect(screen.getByTestId("in-7yi")).toBeInTheDocument();
  });

  it("shows resume when a 7 Year Itch session is already open", () => {
    const buyIn = villainsGameDefaults.sevenYearItch.defaultBuyIn;
    useClubWallet.setState({
      clubBalance: villainsGameDefaults.defaultClubBalance,
      activeSession: {
        gameId: "seven_year_itch",
        drinkId: "seven_year_itch",
        buyIn,
        sessionWallet: buyIn,
        settlement: buildSevenYearItchSettlementProfile(buyIn),
      },
    });
    renderSection();
    expect(screen.getByRole("button", { name: /resume 7 year itch/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /7 year itch \(crapless\)/i })).toBeDisabled();
  });
});
