import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.queryByRole("button", { name: /oubliette no\. 9/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
  });

  it("reveals the menu after entering the club", async () => {
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
    expect(await screen.findByText(/tonight’s menu/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /oubliette no\. 9/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /7 year itch/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ui playground/i })).toHaveAttribute("href", "/__playground");
  });

  it("settings modal includes reset game progress", async () => {
    render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark">
        <MemoryRouter initialEntries={["/menu"]}>
          <Routes>
            <Route path="/menu" element={<MainMenuPage />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /settings/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /reset game progress/i })).toBeInTheDocument();
  });
});

describe("BarStubPage (club menu)", () => {
  it("lists unified club menu entries including games", async () => {
    render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark">
        <MemoryRouter initialEntries={["/bar"]}>
          <Routes>
            <Route path="/bar" element={<BarStubPage />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(await screen.findByText(/tonight’s menu/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /oubliette no\. 9/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /loans/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ui playground/i })).toHaveAttribute("href", "/__playground");
  });
});
