import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { env } from "./env.js";
import { authRouter } from "./auth.routes.js";
import { productsRouter } from "./products.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { usersRouter } from "./users.routes.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);

// Serve the built React SPA in production (single-service deploy)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Centralised error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
);

app.listen(env.port, () => {
  console.log(`StockFlow API listening on http://localhost:${env.port}`);
});
