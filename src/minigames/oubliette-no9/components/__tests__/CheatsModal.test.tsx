import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "../../test/testingLibrary";
import { gameConfig } from "@/config/minigames/oublietteNo9GameRules";
import { CheatsModal } from "../CheatsModal";

describe("CheatsModal", () => {
  it("adds credits and closes", () => {
    const onClose = vi.fn();
    const onAddCredits = vi.fn();
    const onAddHands = vi.fn();
    const firstCredits = gameConfig.cheatsModal.creditTopUps[0];

    render(<CheatsModal onClose={onClose} onAddCredits={onAddCredits} onAddHands={onAddHands} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`Add\\s*${firstCredits.toLocaleString()}\\s*Credits`, "i"),
      }),
    );
    expect(onAddCredits).toHaveBeenCalledWith(firstCredits);
    expect(onClose).toHaveBeenCalled();
  });

  it("adds hands and closes", () => {
    const onClose = vi.fn();
    const onAddCredits = vi.fn();
    const onAddHands = vi.fn();
    const firstHands = gameConfig.cheatsModal.parallelHandTopUps[0];

    render(<CheatsModal onClose={onClose} onAddCredits={onAddCredits} onAddHands={onAddHands} />);

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(`Add\\s*${firstHands}\\s*Parallel Hands`, "i") }),
    );
    expect(onAddHands).toHaveBeenCalledWith(firstHands);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders devil deal cheat when callback provided", () => {
    const onSetDevilsDealCheat = vi.fn();
    render(
      <CheatsModal
        onClose={vi.fn()}
        onAddCredits={vi.fn()}
        onAddHands={vi.fn()}
        onSetDevilsDealCheat={onSetDevilsDealCheat}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Devil's Deal: 100% Chance/i }));
    expect(onSetDevilsDealCheat).toHaveBeenCalledTimes(1);
  });
});
