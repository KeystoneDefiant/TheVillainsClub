import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildClubTheme } from "@/theme/clubTheme";
import { OUBLIETTE_STANDALONE_ROUTE } from "@/config/standaloneLanding";
import { useClubWallet } from "@/game/clubWalletStore";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { OublietteNo9LandingPage } from "./OublietteNo9LandingPage";

function renderLanding(route = OUBLIETTE_STANDALONE_ROUTE) {
  return render(
    <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/menu" element={<div>Club menu fallback</div>} />
          <Route path="/minigames/oubliette-no9" element={<div>Oubliette game route</div>} />
          <Route path={OUBLIETTE_STANDALONE_ROUTE} element={<OublietteNo9LandingPage />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("OublietteNo9LandingPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    useClubWallet.getState().resetWalletAndSession();
  });

  it("starts an Oubliette session from the standalone landing", async () => {
    renderLanding();
    fireEvent.click(screen.getByRole("button", { name: /start oubliette/i }));

    expect(screen.getByText("Oubliette game route")).toBeInTheDocument();
    expect(useClubWallet.getState().activeSession?.gameId).toBe("oubliette_no9");
    expect(useClubWallet.getState().clubBalance).toBe(
      villainsGameDefaults.defaultClubBalance - villainsGameDefaults.oublietteNo9.defaultBuyIn,
    );
  });

  it("redirects to the club menu when the standalone landing is disabled", () => {
    vi.stubEnv("VITE_OUBLIETTE_NO9_STANDALONE", "false");

    renderLanding();

    expect(screen.getByText("Club menu fallback")).toBeInTheDocument();
  });
});
