import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "../../test/testingLibrary";
import { GameButton } from "../GameButton";

describe("GameButton", () => {
  it("invokes onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <GameButton onClick={onClick} variant="primary">
        Deal
      </GameButton>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Deal/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled", () => {
    const onClick = vi.fn();
    render(
      <GameButton onClick={onClick} disabled variant="primary">
        Locked
      </GameButton>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Locked/i }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
