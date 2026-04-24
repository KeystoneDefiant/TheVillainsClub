import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "../../test/testingLibrary";
import { GameHeader } from "../GameHeader";

describe("GameHeader", () => {
  it("shows credits and round", () => {
    render(<GameHeader credits={4200} round={3} />);
    expect(screen.getByText(/4,200/)).toBeInTheDocument();
    expect(screen.getByText(/Round:\s*3/)).toBeInTheDocument();
  });

  it("invokes payout and settings callbacks", () => {
    const onShowPayoutTable = vi.fn();
    const onShowSettings = vi.fn();
    render(<GameHeader credits={100} round={1} onShowPayoutTable={onShowPayoutTable} onShowSettings={onShowSettings} />);

    fireEvent.click(screen.getByTitle("Show payout table"));
    expect(onShowPayoutTable).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Open settings/i }));
    expect(onShowSettings).toHaveBeenCalledTimes(1);
  });
});
