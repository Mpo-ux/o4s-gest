import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../utils/validateBody.js";
import jwt from "jsonwebtoken";
import { users, findUserByEmail, addUser, User } from "../data/users.js";
import { JWT_SECRET } from "../config/constants.js";
import OnlineUserManager from "../utils/onlineUserManager.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Middleware de cache para GETs públicos
router.use((req, res, next) => {
  if (req.method === "GET") {
    res.set("Cache-Control", "private, max-age=120, stale-while-revalidate=30");
  }
  next();
});

// Função para verificar passwords - simplificada para debug
const validatePassword = (email: string, password: string): boolean => {
  console.log("[AUTH] Validating password for email:", email);

  // Credenciais simples para debug - incluindo super admin
  const credentials: Record<string, string> = {
    "sergioramos@o4s.tv": "super123",
    "admin@empresa.pt": "admin123",
    "joao@empresa.pt": "user123",
    "maria@teste.pt": "pending123",
  };

  console.log("[AUTH] Available test accounts:", Object.keys(credentials));
  return credentials[email] === password;
};

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Password obrigatória"),
});

// Login endpoint
router.post("/login", validateBody(loginSchema), async (req, res) => {
  try {
    console.log("🔍 Login attempt received:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({
        message: "Email e password são obrigatórios",
      });
    }

    // Procurar utilizador na base de dados
    const user = findUserByEmail(email);

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({
        message: "Credenciais inválidas",
      });
    }

    // Verificar se o utilizador está ativo e aprovado
    if (!user.isActive || user.status !== "APPROVED") {
      console.log("❌ User not active or not approved");
      return res.status(401).json({
        message: "Conta não ativa ou aguarda aprovação",
      });
    }

    // Verificar password
    if (!validatePassword(email, password)) {
      console.log("❌ Invalid password");
      return res.status(401).json({
        message: "Credenciais inválidas",
      });
    }

    // Gerar token JWT e session ID
    const sessionId = uuidv4();
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: sessionId,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Registar utilizador como online
    const onlineManager = OnlineUserManager.getInstance();
    onlineManager.addUser({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionId: sessionId,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    console.log(
      `✅ Login successful for ${user.name} (${user.role}) - Session: ${sessionId}`
    );
    return res.json({
      message: "Login efetuado com sucesso",
      token,
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Register endpoint - Criação de novos utilizadores
const registerSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

router.post("/register", validateBody(registerSchema), async (req, res) => {
  try {
    console.log("📝 Register attempt received:", req.body);
    const { name, email, password, role = "USER" } = req.body;

    // Validar campos obrigatórios
    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        message: "Nome, email e password são obrigatórios",
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Formato de email inválido",
      });
    }

    // Validar password
    if (password.length < 6) {
      return res.status(400).json({
        message: "A password deve ter pelo menos 6 caracteres",
      });
    }

    // Verificar se o email já existe
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      console.log("❌ Email already exists:", email);
      return res.status(400).json({
        message: "Email já está registado",
      });
    }

    // Gerar novo ID
    const newId =
      users.length > 0
        ? (Math.max(...users.map((u) => parseInt(u.id))) + 1).toString()
        : "1";

    // Criar novo utilizador
    const newUser: User = {
      id: newId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role as "ADMIN" | "USER",
      status: "APPROVED", // Utilizadores registados automaticamente aprovados
      isActive: true,
      createdAt: new Date(),
      approvedBy: "system", // Aprovação automática
      approvedAt: new Date(),
    };

    // Adicionar utilizador à base de dados local
    addUser(newUser);

    console.log(`✅ New user registered: ${newUser.name} (${newUser.email})`);

    // Gerar token JWT e sessão
    const sessionId = uuidv4();
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        sessionId,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Registar utilizador como online
    const onlineManager = OnlineUserManager.getInstance();
    onlineManager.addUser({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      sessionId: sessionId,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.status(201).json({
      message: "Conta criada com sucesso!",
      token,
      sessionId,
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
    console.error("❌ Register error:", error);
    res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.sessionId) {
        const onlineManager = OnlineUserManager.getInstance();
        onlineManager.removeUser(decoded.sessionId);
      }
    }

    res.json({ message: "Logout efetuado com sucesso" });
  } catch (error) {
    res.json({ message: "Logout efetuado com sucesso" });
  }
});

// Endpoint para atualizar atividade do utilizador
router.post("/activity", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.sessionId) {
      const onlineManager = OnlineUserManager.getInstance();
      onlineManager.updateUserActivity(decoded.sessionId);
    }

    res.json({ message: "Atividade atualizada" });
  } catch (error) {
    res.status(401).json({ message: "Token inválido" });
  }
});

// Endpoint para obter utilizadores online (apenas para admins)
router.get("/online-users", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = users.find((u) => u.id === decoded.userId);

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const onlineManager = OnlineUserManager.getInstance();
    const onlineUsers = onlineManager.getOnlineUsers();
    const onlineCount = onlineManager.getOnlineCount();
    const countByRole = onlineManager.getOnlineCountByRole();

    res.json({
      count: onlineCount,
      countByRole,
      users: onlineUsers.map((u) => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        role: u.role,
        lastSeen: u.lastSeen,
      })),
    });
  } catch (error) {
    res.status(401).json({ message: "Token inválido" });
  }
});

// Verificar token endpoint
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = users.find(
      (u) => u.id === decoded.userId && u.isActive && u.status === "APPROVED"
    );

    if (!user) {
      return res.status(401).json({ message: "Token inválido" });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(401).json({ message: "Token inválido" });
  }
});

// Change password endpoint
router.post("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = users.find(
      (u) => u.id === decoded.userId && u.isActive && u.status === "APPROVED"
    );

    if (!user) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Password atual e nova password são obrigatórias",
      });
    }

    // Verificar se a password atual está correta
    if (!validatePassword(user.email, currentPassword)) {
      return res.status(400).json({
        message: "Password atual incorreta",
      });
    }

    // Validar nova password
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "A nova password deve ter pelo menos 6 caracteres",
      });
    }

    // Em um sistema real, aqui faria o hash da password e salvaria na base de dados
    // Por agora, apenas simular que foi alterada
    console.log(`[AUTH] Password changed for user: ${user.email}`);

    res.json({
      message: "Password alterada com sucesso",
      success: true,
    });
  } catch (error) {
    console.error("[AUTH] Error changing password:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

export default router;
