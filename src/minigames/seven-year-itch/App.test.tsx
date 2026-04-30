import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { buildSevenYearItchSettlementProfile } from "@/game/sessionSettlement";
import { buildClubTheme } from "@/theme/clubTheme";
import { SevenYearItchRoot } from "./App";

const buyIn = villainsGameDefaults.sevenYearItch.defaultBuyIn;

function renderGame(onReturnToClubMenu = vi.fn()) {
  render(
    <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
      <SevenYearItchRoot
        sessionCredits={buyIn}
        settlement={buildSevenYearItchSettlementProfile(buyIn)}
        onReturnToClubMenu={onReturnToClubMenu}
        onPauseToClub={vi.fn()}
      />
    </MantineProvider>,
  );
  return { onReturnToClubMenu };
}

describe("SevenYearItchRoot", () => {
  afterEach(() => {
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
    fireEvent.click(pass);
    fireEvent.click(screen.getByRole("button", { name: /^roll$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cash out/i })).toBeDisabled();
    });
    expect(onReturnToClubMenu).not.toHaveBeenCalled();
  });
});
