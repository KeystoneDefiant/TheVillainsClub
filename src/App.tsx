import { useMemo } from "react";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { buildClubTheme } from "@/theme/clubTheme";
import { routerBasenameFromBaseUrl } from "@/routerBasename";
import { useThemeLab } from "@/dev/themeLabStore";
import { IntroPage } from "@/pages/IntroPage";
import { MainMenuPage } from "@/pages/MainMenuPage";
import { BarStubPage } from "@/pages/BarStubPage";
import { OublietteNo9Page } from "@/pages/OublietteNo9Page";
import { OublietteNo9LandingPage } from "@/pages/OublietteNo9LandingPage";
import { SevenYearItchPage } from "@/pages/SevenYearItchPage";
import { UiPlayground } from "@/dev/UiPlayground";
import { ShellBandMusicHost } from "@/audio/useShellBandMusic";
import { isOublietteStandaloneLandingEnabled, OUBLIETTE_STANDALONE_ROUTE } from "@/config/standaloneLanding";

export default function App() {
  const themeOverride = useThemeLab((s) => s.override);
  const theme = useMemo(() => buildClubTheme(themeOverride), [themeOverride]);
  const routerBasename = routerBasenameFromBaseUrl(import.meta.env.BASE_URL);

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
      <BrowserRouter basename={routerBasename}>
        <ShellBandMusicHost />
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/menu" element={<MainMenuPage />} />
          <Route path="/bar" element={<BarStubPage />} />
          <Route
            path={OUBLIETTE_STANDALONE_ROUTE}
            element={isOublietteStandaloneLandingEnabled() ? <OublietteNo9LandingPage /> : <Navigate to="/menu" replace />}
          />
          <Route path="/minigames/oubliette-no9" element={<OublietteNo9Page />} />
          <Route path="/minigames/seven-year-itch" element={<SevenYearItchPage />} />
          <Route path="/__playground" element={<UiPlayground />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
