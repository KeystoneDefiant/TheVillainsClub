import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen } from "../../test/testingLibrary";
import type { Card } from "../../types";
import { CardSelector } from "../CardSelector";
import { renderWithMantine } from "../../test/renderWithMantine";

const sample: Card[] = [
  { id: "c1", rank: "A", suit: "hearts" },
  { id: "c2", rank: "K", suit: "spades" },
  { id: "c3", rank: "7", suit: "clubs" },
  { id: "c4", rank: "2", suit: "diamonds" },
];

describe("CardSelector", () => {
  it("calls onSelectCard when a selectable card is clicked", () => {
    const onSelectCard = vi.fn();
    renderWithMantine(
      <CardSelector cards={sample} selectedCard={null} onSelectCard={onSelectCard} removedCards={[]} />,
    );

    fireEvent.click(screen.getByTestId("card-select-c2"));
    expect(onSelectCard).toHaveBeenCalledTimes(1);
    expect(onSelectCard).toHaveBeenCalledWith(sample[1]);
  });

  it("does not call onSelectCard for removed cards", () => {
    const onSelectCard = vi.fn();
    renderWithMantine(
      <CardSelector
        cards={sample}
        selectedCard={null}
        onSelectCard={onSelectCard}
        removedCards={[sample[0]]}
      />,
    );

    fireEvent.click(screen.getByTestId("card-select-c1"));
    expect(onSelectCard).not.toHaveBeenCalled();
  });

  it("still allows selecting other cards when one is removed", () => {
    const onSelectCard = vi.fn();
    renderWithMantine(
      <CardSelector
        cards={sample}
        selectedCard={null}
        onSelectCard={onSelectCard}
        removedCards={[sample[0]]}
      />,
    );

    fireEvent.click(screen.getByTestId("card-select-c3"));
    expect(onSelectCard).toHaveBeenCalledWith(sample[2]);
  });
});
