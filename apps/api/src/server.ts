import express from "express";
import { cacheQuery } from "./utils/cache.js";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import systemRoutes from "./routes/system.js";
import importRoutes from "./routes/import.js";
import logger from "./utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      process.env.FRONTEND_URL || "http://localhost:3000",
    ],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "cache-control",
      "x-requested-with",
      "Accept",
      "Origin",
    ],
  })
);
app.use(express.json());

// Debug middleware para ver todas as chamadas
app.use("*", (req, _res, next) => {
  logger.info(`📞 ${req.method} ${req.originalUrl}`);
  logger.debug("📦 Headers:", Object.keys(req.headers));
  if (req.headers.authorization) {
    logger.info("🔑 Authorization header present");
  } else {
    logger.info("❌ No authorization header");
  }
  next();
});

// Middleware global de logging de requests/responses
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("User-Agent");
  logger.info(`[REQ] ${method} ${originalUrl} - IP: ${ip} - UA: ${userAgent}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `[RES] ${method} ${originalUrl} - Status: ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/import", importRoutes);

// Endpoint de clientes com cache em memória
app.get("/api/clients", async (_req, res) => {
  try {
    const data = await cacheQuery("clients", async () => {
      return [
        { id: 1, nome: "Cliente A" },
        { id: 2, nome: "Cliente B" },
      ];
    });
    res.json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao obter clientes", error: String(error) });
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=30");
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Rota de erro forçado para testes (apenas em ambiente de teste)
if (process.env.NODE_ENV === "test") {
  app.get("/api/forcar-erro", (_req, res) => {
    res.set("Cache-Control", "no-store");
    throw new Error("Erro forçado para teste");
  });
}

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error(err.stack || err);
    res.status(500).json({ message: "Algo correu mal!" });
  }
);

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({ message: "Endpoint não encontrado" });
});

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/health`);
});

export default app;
