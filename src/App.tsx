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
import { UiPlayground } from "@/dev/UiPlayground";

export default function App() {
  const themeOverride = useThemeLab((s) => s.override);
  const theme = useMemo(() => buildClubTheme(themeOverride), [themeOverride]);
  const routerBasename = routerBasenameFromBaseUrl(import.meta.env.BASE_URL);

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/menu" element={<MainMenuPage />} />
          <Route path="/bar" element={<BarStubPage />} />
          <Route path="/minigames/oubliette-no9" element={<OublietteNo9Page />} />
          {import.meta.env.DEV ? <Route path="/__playground" element={<UiPlayground />} /> : null}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
