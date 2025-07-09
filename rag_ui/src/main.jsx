import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import { Provider } from "./components/ui/provider";
import "./index.scss";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
