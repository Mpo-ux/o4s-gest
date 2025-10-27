import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validateBody } from "../utils/validateBody.js";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import {
  users,
  updateUser,
  addUser,
  getPendingUsers,
  getAllUsers,
  findUserByEmail,
  type User,
} from "../data/users.js";
import { JWT_SECRET } from "../config/constants.js";

const router = Router();

// Middleware de cache para GETs públicos
router.use((req, res, next) => {
  if (req.method === "GET") {
    res.set("Cache-Control", "private, max-age=120, stale-while-revalidate=30");
  }
  next();
});

// Interface para request com user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Schemas para ações administrativas

// Aprovar utilizador
// Middleware para verificar autenticação e role de super admin
const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    console.log(
      "[ADMIN AUTH] Authorization header:",
      authHeader ? "Present" : "Missing"
    );
    logger.debug("[ADMIN AUTH] Token:", token ? "Present" : "Missing");

    // Rejeitar utilizador
    if (!token) {
      logger.warn("[ADMIN AUTH] ❌ Token não fornecido");
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    logger.debug("[ADMIN AUTH] Token decoded:", {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    if (decoded.role !== "SUPER_ADMIN") {
      logger.warn("[ADMIN AUTH] ❌ Role não é SUPER_ADMIN:", decoded.role);
      return res
        .status(403)
        .json({ message: "Acesso negado. Apenas Super Administradores." });
    }

    console.log("[ADMIN AUTH] ✅ Super admin autorizado");
    logger.info("[ADMIN AUTH] ✅ Super admin autorizado");
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("[ADMIN AUTH] ❌ Erro ao verificar token:", error);
    res.status(401).json({ message: "Token inválido" });
  }
};

// Obter utilizadores pendentes
// Suspender utilizador
router.get(
  "/pending-users",
  requireSuperAdmin,
  (_req: AuthenticatedRequest, res: Response) => {
    try {
      const pendingUsers = getPendingUsers();
      console.log(
        "🔍 Utilizadores pendentes encontrados:",
        pendingUsers.length
      );
      logger.info(
        "🔍 Utilizadores pendentes encontrados:",
        pendingUsers.length
      );
      res.json({ users: pendingUsers });
    } catch (error) {
      // Ativar utilizador
      logger.error("Erro ao obter utilizadores pendentes:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

// Obter todos os utilizadores
router.get(
  "/users",
  requireSuperAdmin,
  (_req: AuthenticatedRequest, res: Response) => {
    try {
      const safeUsers = getAllUsers();
      console.log("🔍 Total de utilizadores:", safeUsers.length);
      logger.info("🔍 Total de utilizadores:", safeUsers.length);
      res.json({ users: safeUsers });
    } catch (error) {
      logger.error("Erro ao obter utilizadores:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

// Aprovar utilizador
router.post(
  "/users/:id/approve",
  requireSuperAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const adminId = req.user!.userId;

      const user = users.find((user) => user.id === userId);

      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }

      if (user.status === "APPROVED") {
        return res.status(400).json({ message: "Utilizador já está aprovado" });
      }

      updateUser(userId, {
        status: "APPROVED",
        isActive: true,
        approvedBy: adminId,
        approvedAt: new Date(),
      });

      const updatedUser = users.find((u) => u.id === userId);
      console.log(
        `✅ Utilizador ${updatedUser?.name} aprovado por super admin ${adminId}`
      );
      logger.info(
        `✅ Utilizador ${updatedUser?.name} aprovado por super admin ${adminId}`
      );
      res.json({
        message: "Utilizador aprovado com sucesso",
        user: updatedUser,
      });
    } catch (error) {
      logger.error("Erro ao aprovar utilizador:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

// Rejeitar utilizador
router.post(
  "/users/:id/reject",
  requireSuperAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;

      const user = users.find((user) => user.id === userId);

      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }

      updateUser(userId, {
        status: "REJECTED",
        isActive: false,
      });

      const updatedUser = users.find((u) => u.id === userId);
      console.log(`❌ Utilizador ${updatedUser?.name} rejeitado`);
      logger.info(`❌ Utilizador ${updatedUser?.name} rejeitado`);
      res.json({ message: "Utilizador rejeitado", user: updatedUser });
    } catch (error) {
      logger.error("Erro ao rejeitar utilizador:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

// Suspender utilizador
router.post(
  "/users/:id/suspend",
  requireSuperAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;

      const user = users.find((user) => user.id === userId);

      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }

      if (user.role === "SUPER_ADMIN") {
        return res
          .status(400)
          .json({ message: "Não é possível suspender um Super Administrador" });
      }

      updateUser(userId, {
        status: "SUSPENDED",
        isActive: false,
      });

      const updatedUser = users.find((u) => u.id === userId);
      console.log(`⏸️ Utilizador ${updatedUser?.name} suspenso`);
      logger.info(`⏸️ Utilizador ${updatedUser?.name} suspenso`);
      res.json({ message: "Utilizador suspenso", user: updatedUser });
    } catch (error) {
      logger.error("Erro ao suspender utilizador:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

// Ativar utilizador
router.post(
  "/users/:id/activate",
  requireSuperAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;

      const user = users.find((user) => user.id === userId);

      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }

      updateUser(userId, {
        status: "APPROVED",
        isActive: true,
      });

      const updatedUser = users.find((u) => u.id === userId);
      console.log(`▶️ Utilizador ${updatedUser?.name} ativado`);
      logger.info(`▶️ Utilizador ${updatedUser?.name} ativado`);
      res.json({ message: "Utilizador ativado", user: updatedUser });
    } catch (error) {
      logger.error("Erro ao ativar utilizador:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

// Criar novo utilizador
const adminCreateUserSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "USER"]),
  password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
});

router.post(
  "/users",
  requireSuperAdmin,
  validateBody(adminCreateUserSchema),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, email, role, password } = req.body;
      const adminId = req.user!.userId;

      if (!name || !email || !role || !password) {
        return res
          .status(400)
          .json({ message: "Todos os campos são obrigatórios" });
      }

      // Verificar se email já existe
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está registado" });
      }

      // Gerar novo ID
      const newId = (
        Math.max(...users.map((u) => parseInt(u.id))) + 1
      ).toString();

      const newUser: User = {
        id: newId,
        name,
        email,
        role: role as "ADMIN" | "USER",
        status: "APPROVED",
        isActive: true,
        createdAt: new Date(),
        approvedBy: adminId,
        approvedAt: new Date(),
      };

      addUser(newUser);

      console.log(
        `➕ Novo utilizador ${name} criado por super admin ${adminId}`
      );
      logger.info(
        `➕ Novo utilizador ${name} criado por super admin ${adminId}`
      );
      res.status(201).json({
        message: "Utilizador criado com sucesso",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error) {
      logger.error("Erro ao criar utilizador:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

// Eliminar utilizador (apenas Super Admin)
router.delete(
  "/users/:id",
  requireSuperAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const adminId = req.user!.userId;

      // Não permitir que o super admin se elimine a si próprio
      if (userId === adminId) {
        return res
          .status(400)
          .json({ message: "Não pode eliminar a sua própria conta" });
      }

      const userIndex = users.findIndex((user) => user.id === userId);

      if (userIndex === -1) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }

      const userToDelete = users[userIndex];

      // Remover utilizador da lista
      users.splice(userIndex, 1);

      console.log(
        `🗑️ Utilizador ${userToDelete.name} (${userToDelete.email}) eliminado por super admin ${adminId}`
      );
      logger.info(
        `🗑️ Utilizador ${userToDelete.name} (${userToDelete.email}) eliminado por super admin ${adminId}`
      );
      res.json({
        message: "Utilizador eliminado com sucesso",
        deletedUser: {
          id: userToDelete.id,
          name: userToDelete.name,
          email: userToDelete.email,
        },
      });
    } catch (error) {
      logger.error("Erro ao eliminar utilizador:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

export default router;
