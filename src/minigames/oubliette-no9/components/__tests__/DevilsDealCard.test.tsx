import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "../../test/testingLibrary";
import { DevilsDealCard } from "../DevilsDealCard";
import type { Card } from "../../types";

const sampleCard: Card = { id: "as", rank: "A", suit: "spades" };

describe("DevilsDealCard", () => {
  it("shows cost and quip and calls onHold when clicked", () => {
    const onHold = vi.fn();
    render(
      <DevilsDealCard
        card={sampleCard}
        cost={100}
        quip="The house always has another deck."
        isHeld={false}
        isDisabled={false}
        onHold={onHold}
      />,
    );

    expect(screen.getByText(/Cost:.*100.*credits/i)).toBeInTheDocument();
    expect(screen.getByText(/The house always has another deck/i)).toBeInTheDocument();

    const region = screen.getByText(/Cost:.*100.*credits/i).closest(".devil-deal-container");
    expect(region).toBeTruthy();
    fireEvent.click(region as HTMLElement);
    expect(onHold).toHaveBeenCalledTimes(1);
  });

  it("does not call onHold when disabled", () => {
    const onHold = vi.fn();
    render(
      <DevilsDealCard
        card={sampleCard}
        cost={50}
        quip=""
        isHeld={false}
        isDisabled
        onHold={onHold}
      />,
    );

    const region = screen.getByRole("button", { name: /Devil's deal card/i });
    fireEvent.click(region);
    expect(onHold).not.toHaveBeenCalled();
  });
});
