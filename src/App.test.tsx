import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { buildClubTheme } from "@/theme/clubTheme";
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
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
  });
});
