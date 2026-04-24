import {
  act,
  cleanup,
  fireEvent,
  render as rtlRender,
  screen,
  waitFor,
  within,
  type RenderOptions,
} from "@testing-library/react";
import { createElement, type ComponentType, type ReactElement, type ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { buildClubTheme } from "@/theme/clubTheme";

export { act, cleanup, fireEvent, screen, waitFor, within };

/** RTL render wrapped in the same Mantine shell as the club app (required for Oubliette UI tests). */
export function render(ui: ReactElement, options?: RenderOptions) {
  const Inner = options?.wrapper;
  function Shell({ children }: { children: ReactNode }) {
    const theme = buildClubTheme();
    return createElement(
      MantineProvider,
      { theme, defaultColorScheme: "dark" as const, forceColorScheme: "dark" as const },
      Inner ? createElement(Inner as ComponentType<{ children: ReactNode }>, null, children) : children,
    );
  }
  return rtlRender(ui, { ...options, wrapper: Shell });
}
