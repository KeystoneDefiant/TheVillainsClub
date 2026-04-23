import { useMemo } from "react";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { buildClubTheme } from "@/theme/clubTheme";
import { useThemeLab } from "@/dev/themeLabStore";
import { IntroPage } from "@/pages/IntroPage";
import { MainMenuPage } from "@/pages/MainMenuPage";
import { BarStubPage } from "@/pages/BarStubPage";
import { UiPlayground } from "@/dev/UiPlayground";

export default function App() {
  const themeOverride = useThemeLab((s) => s.override);
  const theme = useMemo(() => buildClubTheme(themeOverride), [themeOverride]);

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/menu" element={<MainMenuPage />} />
          <Route path="/bar" element={<BarStubPage />} />
          {import.meta.env.DEV ? <Route path="/__playground" element={<UiPlayground />} /> : null}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
