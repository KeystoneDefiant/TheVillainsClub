import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import "./styles/fonts.css";
import "./ui/cards/playingCardSurface.css";
import "./index.css";
import "./styles/shellAnimations.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
