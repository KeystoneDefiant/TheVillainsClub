import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "../../test/testingLibrary";
import { MainMenu } from "../MainMenu";

describe("MainMenu", () => {
  it("calls handlers for primary actions", () => {
    const onStartRun = vi.fn();
    const onTutorial = vi.fn();
    const onCredits = vi.fn();
    const onSettings = vi.fn();

    render(
      <MainMenu
        onStartRun={onStartRun}
        onTutorial={onTutorial}
        onCredits={onCredits}
        onSettings={onSettings}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Start Run/i }));
    expect(onStartRun).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /How to Play/i }));
    expect(onTutorial).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /^Credits$/i }));
    expect(onCredits).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Settings/i }));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});
