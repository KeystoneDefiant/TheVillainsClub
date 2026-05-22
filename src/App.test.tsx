import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { buildClubTheme } from "@/theme/clubTheme";
import { BarStubPage } from "@/pages/BarStubPage";
import { MainMenuPage } from "@/pages/MainMenuPage";

describe("MainMenuPage", () => {
  it("shows threshold actions before entering the club", () => {
    render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark">
        <MemoryRouter initialEntries={["/menu"]}>
          <Routes>
            <Route path="/menu" element={<MainMenuPage />} />
            <Route path="/bar" element={<BarStubPage />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(screen.getByRole("button", { name: /enter the club/i })).toBeInTheDocument();
    // Game entry buttons are not visible before entering
    expect(screen.queryByRole("button", { name: /oubliette number 9/i })).not.toBeInTheDocument();
  });

  it("reveals the game menu after entering the club", async () => {
    render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark">
        <MemoryRouter initialEntries={["/menu"]}>
          <Routes>
            <Route path="/menu" element={<MainMenuPage />} />
            <Route path="/bar" element={<BarStubPage />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /enter the club/i }));
    // Wait for the bar menu to mount
    expect(await screen.findByRole("button", { name: /oubliette number 9/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /7 year itch/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ui playground/i })).toHaveAttribute("href", "/__playground");
  });
});

describe("BarStubPage (club menu)", () => {
  it("lists game entry buttons", async () => {
    render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark">
        <MemoryRouter initialEntries={["/bar"]}>
          <Routes>
            <Route path="/bar" element={<BarStubPage />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(await screen.findByRole("button", { name: /oubliette number 9/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /7 year itch/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ui playground/i })).toHaveAttribute("href", "/__playground");
  });
});
