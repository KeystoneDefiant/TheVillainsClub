import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen } from "../../test/testingLibrary";
import { ErrorScreen } from "../ErrorScreen";
import { renderWithMantine } from "../../test/renderWithMantine";

describe("ErrorScreen", () => {
  it("shows heading, message, and error text", () => {
    const err = new Error("Deck checksum failed");
    renderWithMantine(<ErrorScreen error={err} resetErrorBoundary={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /Something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    expect(screen.getByText("Deck checksum failed")).toBeInTheDocument();
  });

  it("invokes resetErrorBoundary when Try again is clicked", () => {
    const reset = vi.fn();
    renderWithMantine(<ErrorScreen error={new Error("x")} resetErrorBoundary={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
