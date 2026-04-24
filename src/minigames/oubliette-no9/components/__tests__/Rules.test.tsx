import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen, within } from "../../test/testingLibrary";
import { Rules } from "../Rules";
import { renderWithMantine } from "../../test/renderWithMantine";

describe("Rules", () => {
  it("does not show dialog content when closed", () => {
    renderWithMantine(<Rules isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens modal with title and gameplay sections when open", () => {
    renderWithMantine(<Rules isOpen onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("How to Play")).toBeInTheDocument();
    expect(within(dialog).getByText(/Oubliette No\. 9 is a high-stakes/i)).toBeInTheDocument();
    expect(within(dialog).getByText("Gameplay")).toBeInTheDocument();
    expect(within(dialog).getByText("Hand Rankings")).toBeInTheDocument();
    expect(within(dialog).getByText("Strategy Tips")).toBeInTheDocument();
    expect(within(dialog).getByText(/You are dealt five cards initially/i)).toBeInTheDocument();
  });

  it("calls onClose when the modal close button is clicked", () => {
    const onClose = vi.fn();
    renderWithMantine(<Rules isOpen onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    const header = within(dialog).getByRole("banner");
    fireEvent.click(within(header).getByRole("button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
