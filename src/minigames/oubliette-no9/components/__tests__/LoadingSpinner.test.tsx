import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/testingLibrary";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("shows default loading message", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows a custom message", () => {
    render(<LoadingSpinner message="Shuffling the deck…" />);
    expect(screen.getByText("Shuffling the deck…")).toBeInTheDocument();
  });
});
