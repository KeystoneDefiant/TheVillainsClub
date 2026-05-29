import { MantineProvider } from "@mantine/core";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useClubWallet } from "@/game/clubWalletStore";
import { buildClubTheme } from "@/theme/clubTheme";

/** Stub matchMedia so usePrefersReducedMotion doesn't spin on missing browser API. */
function mockMatchMedia(reduceMotion = false) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: reduceMotion ? query === "(prefers-reduced-motion: reduce)" : false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}
import { MastertonPage } from "./MastertonPage";

let originalRAF: typeof global.requestAnimationFrame;
let originalCAF: typeof global.cancelAnimationFrame;

beforeAll(() => {
  originalRAF = global.requestAnimationFrame;
  originalCAF = global.cancelAnimationFrame;
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0) as unknown as number;
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  mockMatchMedia(true); // prefers-reduced-motion shortcircuits animation timers
});

afterAll(() => {
  global.requestAnimationFrame = originalRAF;
  global.cancelAnimationFrame = originalCAF;
});

function renderGameRoute() {
  return render(
    <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
      <MemoryRouter initialEntries={["/minigames/masterson-1881"]}>
        <Routes>
          <Route path="/menu" element={<div>Menu fallback</div>} />
          <Route path="/bar" element={<div>Bar fallback</div>} />
          <Route path="/minigames/masterson-1881" element={<MastertonPage />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("MastertonPage", () => {
  afterEach(() => {
    useClubWallet.getState().resetWalletAndSession();
    vi.restoreAllMocks();
  });

  it("redirects to /menu when there is no Masterton session", () => {
    renderGameRoute();
    expect(screen.getByText("Menu fallback")).toBeInTheDocument();
  });

  it("renders MastertonPage and the live guide when an active tutorial session is started", async () => {
    act(() => {
      useClubWallet.getState().startTutorialSession("masterson_1881");
    });

    renderGameRoute();

    // Verify it doesn't redirect
    expect(screen.queryByText("Menu fallback")).not.toBeInTheDocument();

    // The Masterton Page lazy loads MastertonRoot, so we should wait for a Masterton-specific text to render.
    // Allow up to 15s — the lazy bundle can take a few seconds in a full test suite run.
    expect(await screen.findByText("Masterton 1881", {}, { timeout: 15000 })).toBeInTheDocument();

    // Verify Sommelier live guide renders because isTutorial is true
    expect(screen.getByText("Pazillus A. Rabellum")).toBeInTheDocument();
    expect(screen.getByText("Club Sommelier")).toBeInTheDocument();
    expect(screen.getByText("Welcome to Masterton 1881")).toBeInTheDocument();
  }, 20000);
});
