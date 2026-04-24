import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, screen } from "../../test/testingLibrary";
import { ErrorBoundary } from "../ErrorBoundary";
import { renderWithMantine } from "../../test/renderWithMantine";

function ThrowingChild({ message }: { message: string }): never {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    renderWithMantine(
      <ErrorBoundary>
        <div data-testid="ok-child">healthy</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("ok-child")).toHaveTextContent("healthy");
  });

  it("renders custom fallback when provided", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithMantine(
      <ErrorBoundary fallback={<div data-testid="custom-fb">custom</div>}>
        <ThrowingChild message="ignored" />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("custom-fb")).toHaveTextContent("custom");
  });

  it("renders default fallback with try again when child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithMantine(
      <ErrorBoundary>
        <ThrowingChild message="table-felt-torn" />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: /Something went wrong/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Try again/i })).toBeInTheDocument();
    expect(screen.getByText(/Error: table-felt-torn/i)).toBeInTheDocument();
  });

  it("shows return to menu and reload actions when handlers apply", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onReturnToMenu = vi.fn();

    renderWithMantine(
      <ErrorBoundary onReturnToMenu={onReturnToMenu}>
        <ThrowingChild message="x" />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Return to menu/i }));
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("button", { name: /Reload page/i })).toBeEnabled();
  });
});
