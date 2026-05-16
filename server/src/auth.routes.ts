import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";
import {
  clearSessionCookie,
  readSession,
  requireAuth,
  setSessionCookie,
  signSession,
  type Role,
} from "./auth.js";
import { loginSchema, signupSchema } from "./validation.js";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { email, password, organizationName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      organization: { create: { name: organizationName } },
    },
  });

  const token = signSession({
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    role: user.role as Role,
  });
  setSessionCookie(res, token);
  res.json({ user: { id: user.id, email: user.email, organizationId: user.organizationId, role: user.role } });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signSession({
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    role: user.role as Role,
  });
  setSessionCookie(res, token);
  res.json({ user: { id: user.id, email: user.email, organizationId: user.organizationId, role: user.role } });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const s = req.session!;
  const org = await prisma.organization.findUnique({ where: { id: s.organizationId } });
  res.json({
    user: { id: s.userId, email: s.email, organizationId: s.organizationId, role: s.role },
    organization: org
      ? {
          id: org.id,
          name: org.name,
          defaultLowStockThreshold: org.defaultLowStockThreshold,
        }
      : null,
  });
});

// Convenience: returns 200 with null when not logged in (used by SPA on first load)
authRouter.get("/session", async (req, res) => {
  const s = readSession(req);
  if (!s) return res.json({ user: null });
  // Re-fetch role from DB so role changes take effect without re-login
  const dbUser = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!dbUser) {
    return res.json({ user: null });
  }
  const org = await prisma.organization.findUnique({ where: { id: s.organizationId } });
  res.json({
    user: { id: s.userId, email: s.email, organizationId: s.organizationId, role: dbUser.role },
    organization: org
      ? {
          id: org.id,
          name: org.name,
          defaultLowStockThreshold: org.defaultLowStockThreshold,
        }
      : null,
  });
});
