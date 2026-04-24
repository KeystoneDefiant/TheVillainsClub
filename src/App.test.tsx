import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { buildClubTheme } from "@/theme/clubTheme";
import { BarStubPage } from "@/pages/BarStubPage";
import { MainMenuPage } from "@/pages/MainMenuPage";

describe("MainMenuPage", () => {
  it("shows club balance and primary actions", () => {
    render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark">
        <MemoryRouter initialEntries={["/menu"]}>
          <Routes>
            <Route path="/menu" element={<MainMenuPage />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(screen.getByText("Club balance", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter the club/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /oubliette no\. 9/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^continue$/i })).toBeDisabled();
  });
});

describe("BarStubPage (club menu)", () => {
  it("lists table games including Oubliette", () => {
    render(
      <MantineProvider theme={buildClubTheme()} defaultColorScheme="dark">
        <MemoryRouter initialEntries={["/bar"]}>
          <Routes>
            <Route path="/bar" element={<BarStubPage />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(screen.getByText("Tables", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /oubliette no\. 9 \(table\)/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to main menu/i })).toBeInTheDocument();
  });
});
