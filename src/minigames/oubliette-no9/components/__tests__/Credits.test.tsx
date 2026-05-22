import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "../../test/testingLibrary";
import { Credits } from "../Credits";

describe("Credits", () => {
  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<Credits onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
