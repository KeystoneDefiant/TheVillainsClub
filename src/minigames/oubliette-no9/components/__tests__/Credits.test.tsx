import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "../../test/testingLibrary";
import { Credits } from "../Credits";

describe("Credits", () => {
  it("shows credits content and closes", () => {
    const onClose = vi.fn();
    render(<Credits onClose={onClose} />);

    expect(screen.getByRole("heading", { name: /Oubliette No\. 9/i })).toBeInTheDocument();
    expect(screen.getByText(/Chris Flohr/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
