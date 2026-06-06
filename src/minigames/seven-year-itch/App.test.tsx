import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { buildSevenYearItchSettlementProfile } from "@/game/sessionSettlement";
import { buildClubTheme } from "@/theme/clubTheme";
import { SevenYearItchRoot } from "./App";
import { useBarBandOverrideStore } from "@/audio/barBandOverrideStore";

vi.mock("@/motion/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => true,
}));

const buyIn = villainsGameDefaults.sevenYearItch.defaultBuyIn;

function renderGame(onReturnToClubMenu = vi.fn(), gameModeId?: string) {
  render(
    <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
      <SevenYearItchRoot
        sessionCredits={buyIn}
        settlement={buildSevenYearItchSettlementProfile(buyIn)}
        onReturnToClubMenu={onReturnToClubMenu}
        onPauseToClub={vi.fn()}
        gameModeId={gameModeId}
      />
    </MantineProvider>,
  );
  return { onReturnToClubMenu };
}

describe("SevenYearItchRoot", () => {
  beforeEach(() => {
    useBarBandOverrideStore.getState().setEveningBandIndexOverride(0);
  });

  afterEach(() => {
    useBarBandOverrideStore.getState().setEveningBandIndexOverride(null);
    vi.restoreAllMocks();
  });

  it("settles early when there is no active point", async () => {
    const { onReturnToClubMenu } = renderGame();

    fireEvent.click(screen.getByRole("button", { name: /cash out/i }));
    const dialog = await screen.findByRole("dialog", { name: /cash out/i });
    fireEvent.click(within(dialog).getByRole("button", { name: /confirm cash out/i }));

    expect(onReturnToClubMenu).toHaveBeenCalledTimes(1);
    expect(onReturnToClubMenu.mock.calls[0]?.[0]).toMatchObject({
      tableRound: 0,
      totalReturn: buyIn,
    });
  });

  it("keeps early settlement disabled while a point is active", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.2);
    const { onReturnToClubMenu } = renderGame();

    const pass = screen.getByTestId("felt-pass");
    fireEvent.click(pass);
    await waitFor(() => expect(screen.getByText("On felt").nextElementSibling?.textContent).toBe("50"));
    fireEvent.click(screen.getByRole("button", { name: /^roll$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cash out/i })).toBeDisabled();
    });
    expect(onReturnToClubMenu).not.toHaveBeenCalled();
  });

  it("shows the Evidence Locker Key recovery section in the recap modal when the favor is active on a 7 out", async () => {
    const randomMock = vi.spyOn(Math, "random");
    let randomCallIndex = 0;
    const randomSequence = [
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, // 6 mount-time calls
      // Roll 1: d1=6 (0.9), d2=6 (0.9) -> total 12 (point 12)
      0.9, 0.9,
      0.5, // roll story
      // Roll 2: d1=2 (0.1666), d2=3 (0.3333) -> total 5
      0.1666, 0.3333,
      0.5, // roll story
      // Roll 3: d1=2 (0.1666), d2=3 (0.3333) -> total 5
      0.1666, 0.3333,
      0.5, // roll story
      // pickWeightedWithoutReplacement calls rng() 3 times for picks. We want "evidence_locker_key" (pullWeight 28, index 4).
      // Remaining weights: 38 (look_the_other_way), 22 (kingpin), 18 (agg), 18 (clean), 28 (evidence). Total 124.
      // 0.9 * 124 = 111.6. index 4: 111.6 - 38 - 22 - 18 - 18 = 15.6 <= 28. Selected!
      0.9, 0.9, 0.9,
      // Roll 4: d1=3 (0.4), d2=4 (0.5) -> total 7
      0.4, 0.5,
      0.5, // roll story
    ];
    randomMock.mockImplementation(() => {
      const val = randomSequence[randomCallIndex];
      console.log(`TEST1 Random Call ${randomCallIndex}: returning ${val}`);
      randomCallIndex++;
      return val ?? 0.5;
    });

    renderGame(vi.fn(), "quickTable");

    // Toggle Easy Mode off to run in normal mode
    const toggle = screen.getByTestId("felt-easy-toggle");
    fireEvent.click(toggle);

    // Add pass line bet
    const pass = screen.getByTestId("felt-pass");
    fireEvent.click(pass);
    await waitFor(() => expect(screen.getByText("On felt").nextElementSibling?.textContent).toBe("25"));

    // Roll 1 (sets point to 12)
    const rollBtn = screen.getByRole("button", { name: /^roll$/i });
    fireEvent.click(rollBtn);
    await screen.findByText(/rolls\s*:\s*1/i);

    // Roll 2 (roll 5, heat + 1)
    fireEvent.click(screen.getByRole("button", { name: /^roll$/i }));
    await screen.findByText(/rolls\s*:\s*2/i);

    // Roll 3 (roll 5, heat + 1 -> triggers favors choice)
    fireEvent.click(screen.getByRole("button", { name: /^roll$/i }));

    // Verify favors screen is shown and click Evidence Locker Key
    await screen.findByText("Favors");
    const favorCard = screen.getByText("Evidence Locker Key").closest("div");
    const takeFavorBtn = within(favorCard!).getByRole("button", { name: /take this favor/i });
    fireEvent.click(takeFavorBtn);

    // Now back at table. Put a place bet on 5 to make refund visible
    const place5 = screen.getByTestId("felt-place-5");
    fireEvent.click(place5);
    await waitFor(() => expect(screen.getByText("On felt").nextElementSibling?.textContent).toBe("50"));

    // Roll 4 (rolls 7, ends hand, triggers recap)
    await waitFor(() => expect(screen.getByRole("button", { name: /^roll$/i })).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: /^roll$/i }));

    // Wait for the modal and verify Evidence Locker Key recovery section is visible
    await screen.findByRole("dialog", { name: /the bust/i });
    expect(screen.getByText(/evidence locker key recovery/i)).toBeInTheDocument();
    expect(screen.getByText(/\+15 credits returned from felt/i)).toBeInTheDocument(); // 50 total on felt (25 pass + 25 place) * 0.30 = 15 credits
  });

  it("does not show the Evidence Locker Key recovery section when the favor is not active on a 7 out", async () => {
    const randomMock = vi.spyOn(Math, "random");
    let randomCallIndex = 0;
    const randomSequence = [
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, // 6 mount-time calls
      // Roll 1: d1=6 (0.9), d2=6 (0.9) -> total 12 (point 12)
      0.9, 0.9,
      0.5, // roll story
      // Roll 2: d1=3 (0.4), d2=4 (0.5) -> total 7
      0.4, 0.5,
      0.5, // roll story
    ];
    randomMock.mockImplementation(() => {
      const val = randomSequence[randomCallIndex];
      console.log(`TEST2 Random Call ${randomCallIndex}: returning ${val}`);
      randomCallIndex++;
      return val ?? 0.5;
    });

    renderGame(vi.fn(), "quickTable");

    // Add pass line bet
    const pass = screen.getByTestId("felt-pass");
    fireEvent.click(pass);
    await waitFor(() => expect(screen.getByText("On felt").nextElementSibling?.textContent).toBe("25"));

    // Roll 1 (sets point to 12)
    const rollBtn = screen.getByRole("button", { name: /^roll$/i });
    fireEvent.click(rollBtn);
    await screen.findByText(/rolls\s*:\s*1/i);

    // Roll 2 (rolls 7, ends hand, triggers recap)
    fireEvent.click(screen.getByRole("button", { name: /^roll$/i }));

    // Wait for the modal and verify Evidence Locker Key recovery section is NOT visible
    await screen.findByRole("dialog", { name: /the bust/i });
    expect(screen.queryByText(/evidence locker key recovery/i)).toBeNull();
  });

  it("renders the Easy Mode toggle switch by default (switch mode), and defaults to easy mode active", async () => {
    renderGame();
    // In come-out roll phase, showGrid is false, so instructions and easy-toggle are visible.
    const toggle = screen.getByTestId("felt-easy-toggle");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeChecked();

    // Verify we render the 5-column easy layout place cells
    expect(screen.getByTestId("felt-place-easy-2-12")).toBeInTheDocument();
    expect(screen.queryByTestId("felt-place-2")).toBeNull();
  });

  it("allows toggling Easy Mode off/on during the come-out phase", async () => {
    renderGame();
    const toggle = screen.getByTestId("felt-easy-toggle");
    expect(toggle).toBeChecked();

    // Toggle off
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();

    // Toggling off should update the place cells immediately (even though they are off/disabled during come-out)
    expect(screen.queryByTestId("felt-place-easy-2-12")).toBeNull();
    expect(screen.getByTestId("felt-place-2")).toBeInTheDocument();

    // Toggle back on
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(screen.getByTestId("felt-place-easy-2-12")).toBeInTheDocument();
    expect(screen.queryByTestId("felt-place-2")).toBeNull();
  });

  it("hides the toggle switch when points are active and felt is unfurled (Divest is active)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.2); // Roll results will set a point
    renderGame();

    // Make pass line bet to allow rolling
    const pass = screen.getByTestId("felt-pass");
    fireEvent.click(pass);
    await waitFor(() => expect(screen.getByText("On felt").nextElementSibling?.textContent).toBe("50"));

    // Roll to establish point
    fireEvent.click(screen.getByRole("button", { name: /^roll$/i }));
    
    // Now a point is active (phase === "point").
    // The divest button is visible.
    const divestBtn = await screen.findByTestId("felt-divest");
    expect(divestBtn).toBeInTheDocument();

    const toggleContainer = screen.getByTestId("felt-easy-toggle").closest(".inactive");
    expect(toggleContainer).toBeInTheDocument();
  });

  it("places bets on both sister numbers in Easy Mode and deducts double chips", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.2); // Will set point to 12
    renderGame();

    // Put pass line bet and roll
    const pass = screen.getByTestId("felt-pass");
    fireEvent.click(pass);
    await waitFor(() => expect(screen.getByText("On felt").nextElementSibling?.textContent).toBe("50"));
    fireEvent.click(screen.getByRole("button", { name: /^roll$/i }));

    // Now point is established. Place an easy bet on 2/12.
    // Chip increment is 50.
    const place2_12 = screen.getByTestId("felt-place-easy-2-12");
    fireEvent.click(place2_12);

    // Clicking 2/12 in Easy Mode places 50 on 2 and 50 on 12.
    // Total on felt should go from 50 (pass line) to 50 + 50 + 50 = 150.
    await waitFor(() => expect(screen.getByText("On felt").nextElementSibling?.textContent).toBe("150"));
    
    // Let's verify the balance deducted 100 credits: buyIn (2000) - 50 (passLine) - 100 (place) = 1850.
    expect(screen.getByText("In hand").nextElementSibling?.textContent).toBe("1,850");
  });

  it("respects forced easy mode configuration, hiding the toggle switch", async () => {
    renderGame(vi.fn(), "easyTable");

    // Toggle switch should not be rendered at all
    expect(screen.queryByTestId("felt-easy-toggle")).toBeNull();

    // Place layout should be Easy mode 5-column layout
    expect(screen.getByTestId("felt-place-easy-2-12")).toBeInTheDocument();
  });

  it("respects forced normal mode configuration, hiding the toggle switch", async () => {
    renderGame(vi.fn(), "normalTable");

    // Toggle switch should not be rendered at all
    expect(screen.queryByTestId("felt-easy-toggle")).toBeNull();

    // Place layout should be Normal mode 10-cell layout
    expect(screen.getByTestId("felt-place-2")).toBeInTheDocument();
  });

  it("renders the tutorial and transitions between easy mode and normal mode based on step mock state", async () => {
    render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
        <SevenYearItchRoot
          sessionCredits={buyIn}
          settlement={buildSevenYearItchSettlementProfile(buyIn)}
          onReturnToClubMenu={vi.fn()}
          onPauseToClub={vi.fn()}
          isTutorial={true}
        />
      </MantineProvider>,
    );

    // Should find the tutorial SommelierLiveGuide dialog
    await screen.findByText(/Welcome to the table/i);

    // Initial step is introduction (default switch mode defaults to Easy Mode active)
    expect(screen.getByTestId("felt-place-easy-2-12")).toBeInTheDocument();

    // Click next step (Step 2 - The Seed Investment)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/In 7 Year Itch, you are investing/i);
    // This step mocks easyMode: false, so it should render the Normal layout instead of Easy layout
    expect(screen.getByTestId("felt-place-2")).toBeInTheDocument();
    expect(screen.queryByTestId("felt-place-easy-2-12")).toBeNull();

    // Go to Step 3 - Active Case Files (also normal mode)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/The number rolled in the previous step determines/i);
    expect(screen.getByTestId("felt-place-2")).toBeInTheDocument();

    // Go to Step 4 - Diversification (also normal mode)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/As you can see here, we have many options/i);
    expect(screen.getByTestId("felt-place-2")).toBeInTheDocument();

    // Go to Step 5 - Divestment (also normal mode)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/Should the heat feel like it's too much/i);
    expect(screen.getByTestId("felt-place-2")).toBeInTheDocument();

    // Go to Step 6 - Heat (also normal mode)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/A good wine should never be hot/i);
    expect(screen.getByTestId("felt-place-2")).toBeInTheDocument();

    // Go to Step 7 - Easy Betting Mode (easyMode: true)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/By default, the table opens in Easy Mode/i);
    expect(screen.getByTestId("felt-place-easy-2-12")).toBeInTheDocument();
    expect(screen.queryByTestId("felt-place-2")).toBeNull();

    // Go to Step 8 - Normal Mode and the Felt Switch (easyMode: false)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/If you prefer more granular control/i);
    expect(screen.getByTestId("felt-place-2")).toBeInTheDocument();
    expect(screen.queryByTestId("felt-place-easy-2-12")).toBeNull();
  });
});
