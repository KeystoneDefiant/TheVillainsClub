import { describe, expect, it, vi } from "vitest";
import { Tutorial } from "../Tutorial";
import { tutorialSlides } from "../../config/tutorialConfig";
import { fireEvent, render, screen } from "../../test/testingLibrary";

describe("Tutorial", () => {
  it("shows first slide and advances with Next", () => {
    const onClose = vi.fn();
    render(<Tutorial onClose={onClose} />);

    expect(screen.getByRole("heading", { name: tutorialSlides[0].title })).toBeInTheDocument();
    expect(screen.getByText(/1 of/)).toHaveTextContent(`1 of ${tutorialSlides.length}`);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: tutorialSlides[1].title })).toBeInTheDocument();
    expect(screen.getByText(/2 of/)).toHaveTextContent(`2 of ${tutorialSlides.length}`);
  });

  it("Back on first slide returns to menu (calls onClose)", () => {
    const onClose = vi.fn();
    render(<Tutorial onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Back to Menu" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Done on last slide closes", () => {
    const onClose = vi.fn();
    render(<Tutorial onClose={onClose} />);

    for (let i = 0; i < tutorialSlides.length - 1; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }

    expect(
      screen.getByRole("heading", { name: tutorialSlides[tutorialSlides.length - 1].title }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("close button in header calls onClose", () => {
    const onClose = vi.fn();
    render(<Tutorial onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Close tutorial" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
