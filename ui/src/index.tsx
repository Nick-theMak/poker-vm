import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const projectId = import.meta.env.VITE_PROJECT_ID;
if (!projectId) {
    throw new Error("Project ID is not defined in .env file");
}

const root = createRoot(document.getElementById("app") as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
