import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { initializePendo } from "./analytics/pendo";

// Boot Novus analytics before rendering so the agent captures the first page view.
initializePendo();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
