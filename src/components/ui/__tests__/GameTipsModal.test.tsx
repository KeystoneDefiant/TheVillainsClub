import { describe, expect, it, vi, beforeAll } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { buildClubTheme } from "@/theme/clubTheme";
import { GameTipsModal } from "../GameTipsModal";
import { gameTipsCatalog } from "@/config/gameTipsCatalog";

/** Stub matchMedia so usePrefersReducedMotion doesn't spin on missing browser API. */
function mockMatchMedia() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

describe("GameTipsModal", () => {
  beforeAll(() => {
    mockMatchMedia();
  });

  const renderModal = (opened: boolean, onClose: () => void, gameId: string | null) => {
    return render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark" forceColorScheme="dark">
        <GameTipsModal opened={opened} onClose={onClose} gameId={gameId} />
      </MantineProvider>
    );
  };

  it("returns null when gameId is null", () => {
    const onClose = vi.fn();
    const { container } = renderModal(true, onClose, null);
    expect(container.querySelector(".tips-modal")).toBeNull();
  });

  it("returns null when gameId does not exist in catalog", () => {
    const onClose = vi.fn();
    const { container } = renderModal(true, onClose, "non_existent_game");
    expect(container.querySelector(".tips-modal")).toBeNull();
  });

  it("shows first slide and advances with Next and goes back with Back", async () => {
    const onClose = vi.fn();
    const gameId = "oubliette_no9";
    const slides = gameTipsCatalog[gameId];
    renderModal(true, onClose, gameId);

    // Assert first slide displays correctly
    expect(await screen.findByRole("heading", { name: slides[0].title })).toBeInTheDocument();
    expect(screen.getByText(`“${slides[0].content}”`)).toBeInTheDocument();
    expect(screen.getByText(`Tip 1 of ${slides.length}`)).toBeInTheDocument();

    // Click Next
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("heading", { name: slides[1].title })).toBeInTheDocument();
    expect(screen.getByText(`“${slides[1].content}”`)).toBeInTheDocument();
    expect(screen.getByText(`Tip 2 of ${slides.length}`)).toBeInTheDocument();

    // Click Back
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("heading", { name: slides[0].title })).toBeInTheDocument();
  });

  it("closes when clicking Done on the last slide", async () => {
    const onClose = vi.fn();
    const gameId = "oubliette_no9";
    const slides = gameTipsCatalog[gameId];
    renderModal(true, onClose, gameId);

    // Advance to the end
    for (let i = 0; i < slides.length - 1; i++) {
      fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    }

    expect(await screen.findByRole("heading", { name: slides[slides.length - 1].title })).toBeInTheDocument();

    // Click Done
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking Back to Menu on the first slide", () => {
    const onClose = vi.fn();
    renderModal(true, onClose, "oubliette_no9");

    // Since first slide "Back" maps to onClose / close modal (Wait, let's check: first slide button name is "Back" but does it say "Back to Menu" or "Back" now?)
    // Ah, in our implementation, goBack has been bound to Back/Close.
    // Let's check: on the first slide, we render:
    // <ClubButton variant="outline" onClick={goBack} disabled={isFirst}>Back</ClubButton>
    // Wait, on the first slide, the Back button is disabled! And the left-hand footer button is "Close Guide" (which calls onClose directly!).
    // Let's check the test: "closes when clicking Back to Menu on the first slide".
    // In our new footer, the left button is "Close Guide" (variant="subtle").
    // Let's make sure the test triggers "Close Guide"!
    fireEvent.click(screen.getByRole("button", { name: "Close Guide" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking the close button", () => {
    const onClose = vi.fn();
    renderModal(true, onClose, "oubliette_no9");

    fireEvent.click(screen.getByRole("button", { name: "Close tips" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("responds to keyboard left/right arrow navigation", async () => {
    const onClose = vi.fn();
    const gameId = "oubliette_no9";
    const slides = gameTipsCatalog[gameId];
    renderModal(true, onClose, gameId);

    // Initial state check
    expect(await screen.findByRole("heading", { name: slides[0].title })).toBeInTheDocument();

    // Press ArrowRight to go to next slide
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(await screen.findByRole("heading", { name: slides[1].title })).toBeInTheDocument();

    // Press ArrowLeft to go back to first slide
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(await screen.findByRole("heading", { name: slides[0].title })).toBeInTheDocument();

    // Press ArrowLeft on first slide to close
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
