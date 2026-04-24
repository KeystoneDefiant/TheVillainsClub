import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "../../test/testingLibrary";
import { CheatsModal } from "../CheatsModal";

describe("CheatsModal", () => {
  it("adds credits and closes", () => {
    const onClose = vi.fn();
    const onAddCredits = vi.fn();
    const onAddHands = vi.fn();

    render(<CheatsModal onClose={onClose} onAddCredits={onAddCredits} onAddHands={onAddHands} />);

    fireEvent.click(screen.getByRole("button", { name: /Add 1000 Credits/i }));
    expect(onAddCredits).toHaveBeenCalledWith(1000);
    expect(onClose).toHaveBeenCalled();
  });

  it("adds hands and closes", () => {
    const onClose = vi.fn();
    const onAddCredits = vi.fn();
    const onAddHands = vi.fn();

    render(<CheatsModal onClose={onClose} onAddCredits={onAddCredits} onAddHands={onAddHands} />);

    fireEvent.click(screen.getByRole("button", { name: /Add 10 Parallel Hands/i }));
    expect(onAddHands).toHaveBeenCalledWith(10);
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
