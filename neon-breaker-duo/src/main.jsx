import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Content } from "./content/Content.jsx";
import { App } from "./ui/App.jsx";
import { GameSessionProvider } from "./game/GameSession.jsx";
import "./ui/style.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GameSessionProvider><App content={<Content />} /></GameSessionProvider>
  </StrictMode>,
);

