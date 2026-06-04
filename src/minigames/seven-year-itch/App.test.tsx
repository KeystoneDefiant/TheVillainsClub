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
});
