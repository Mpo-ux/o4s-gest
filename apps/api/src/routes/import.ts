import { Router, Request, Response } from "express";
import { z } from "zod";
import logger from "../utils/logger.js";

// Simulação de base de dados em memória
let clientes: any[] = [];
let fornecedores: any[] = [];

const router = Router();

const importSchema = z.object({
  type: z.enum(["cliente", "fornecedor"]),
  data: z.array(z.record(z.string(), z.any())),
});

// POST /admin/import
router.post("/import", async (req: Request, res: Response) => {
  try {
    const { type, data } = importSchema.parse(req.body);
    let imported = 0;
    let ignored = 0;
    let alreadyExists: (row: any) => boolean = () => false;

    if (type === "cliente") {
      alreadyExists = (row) =>
        clientes.some(
          (c) =>
            c.nif &&
            row.nif &&
            c.nif === row.nif &&
            c.name &&
            row.name &&
            c.name.trim().toLowerCase() === row.name.trim().toLowerCase()
        );
    } else if (type === "fornecedor") {
      alreadyExists = (row) =>
        fornecedores.some((f) => f.nif && row.nif && f.nif === row.nif);
    }

    for (const row of data) {
      if (!alreadyExists(row)) {
        if (type === "cliente") clientes.push(row);
        else fornecedores.push(row);
        imported++;
      } else {
        ignored++;
      }
    }

    logger.info(
      `[IMPORT] ${imported} novos ${type}s importados, ${ignored} ignorados (duplicados)`
    );
    res.json({ imported, ignored, total: data.length });
  } catch (error: any) {
    logger.error("Erro no import:", error);
    res.status(400).json({ message: error.message || "Erro no import" });
  }
});

// GET /import/list?type=cliente|fornecedor
router.get("/list", (req: Request, res: Response) => {
  const type = req.query.type;
  if (type === "cliente") {
    return res.json({ data: clientes });
  } else if (type === "fornecedor") {
    return res.json({ data: fornecedores });
  }
  return res.status(400).json({ message: "Tipo inválido" });
});

export default router;
