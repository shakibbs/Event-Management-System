import './index.css';
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

import { BrowserRouter } from "react-router-dom";
import { logger } from './lib/logger';

// Debug: Log environment variable at app startup (development only)
logger.debug('API Base URL:', import.meta.env.VITE_API_BASE_URL);

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
	<BrowserRouter>
		<App />
	</BrowserRouter>
);