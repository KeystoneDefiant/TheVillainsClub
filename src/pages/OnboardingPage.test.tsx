import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useClubWallet } from "@/game/clubWalletStore";
import { buildClubTheme } from "@/theme/clubTheme";
import { OnboardingPage, ONBOARDING_SLIDES } from "./OnboardingPage";

/** Stub matchMedia so usePrefersReducedMotion doesn't spin on missing browser API. */
function mockMatchMedia() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: false,
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

function renderOnboardingRoute() {
  return render(
    <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/bar" element={<div data-testid="bar-destination">Bar Menu</div>} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("OnboardingPage", () => {
  beforeAll(() => {
    mockMatchMedia();
  });

  afterEach(() => {
    useClubWallet.getState().resetWalletAndSession();
    vi.restoreAllMocks();
  });

  it("renders name input screen and blocks submit if name is empty", () => {
    renderOnboardingRoute();

    expect(screen.getByText("Welcome to The Villains Club")).toBeInTheDocument();
    expect(screen.getByText("By what name shall we call you?")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Enter the Club" });
    expect(submitBtn).toBeDisabled();
  });

  const getHeaderForSlide = (index: number) => {
    const slide = ONBOARDING_SLIDES[index];
    if (!slide.category && !slide.role) return "";
    if (slide.category && slide.role) {
      return `${slide.category} • ${slide.role}`;
    }
    return slide.category || slide.role || "";
  };

  const assertSlideActive = async (index: number) => {
    const slide = ONBOARDING_SLIDES[index];
    const headerText = getHeaderForSlide(index);
    if (headerText) {
      expect(await screen.findByText(headerText)).toBeInTheDocument();
    }
    if (slide.title) {
      expect(await screen.findByText(slide.title)).toBeInTheDocument();
    }
    expect(await screen.findByText(`${index + 1} of ${ONBOARDING_SLIDES.length}`)).toBeInTheDocument();
  };

  it("enters a name and cycles through staff and lore introduction slides", async () => {
    renderOnboardingRoute();

    const input = screen.getByPlaceholderText("Your name...");
    fireEvent.change(input, { target: { value: "Maleficent" } });

    const submitBtn = screen.getByRole("button", { name: "Enter the Club" });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Assert transitions to Staff/Lore phase and shows the first slide
    await assertSlideActive(0);

    // Cycle through all slides forward
    for (let i = 0; i < ONBOARDING_SLIDES.length - 1; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await assertSlideActive(i + 1);
    }

    // Go back one slide
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await assertSlideActive(ONBOARDING_SLIDES.length - 2);

    // Return to the final slide
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await assertSlideActive(ONBOARDING_SLIDES.length - 1);

    // Complete entry
    const enterBtn = screen.getByRole("button", { name: "Enter Club" });
    fireEvent.click(enterBtn);

    // Verify it triggers zoom phase and redirects to /bar after timeout
    await waitFor(() => {
      expect(screen.getByTestId("bar-destination")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("skips name phase and starts directly at staff/lore dossiers when state.skipName is true", async () => {
    render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
        <MemoryRouter initialEntries={[{ pathname: "/onboarding", state: { skipName: true } }]}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>
    );

    // Verify name entry is bypassed
    expect(screen.queryByText("Welcome to The Villains Club")).not.toBeInTheDocument();

    // Verify it starts directly at slide index 0
    await assertSlideActive(0);
  });
});
