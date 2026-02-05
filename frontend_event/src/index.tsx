import './index.css';
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

import { BrowserRouter } from "react-router-dom";

// Debug: Log environment variable at app startup
console.log('=== ENVIRONMENT DEBUG ===');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('All env vars:', import.meta.env);
console.log('========================');

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
	<BrowserRouter>
		<App />
	</BrowserRouter>
);