import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "./db.js";
import { requireAuth, requireRole } from "./auth.js";
import { userCreateSchema, userUpdateSchema } from "./validation.js";

export const usersRouter = Router();

// Generate a readable temporary password: 4 random bytes hex + 2-digit suffix.
// 10 chars total, mixed alphanumeric, passes the 8-char minimum used elsewhere.
function generateTempPassword(): string {
  const part = crypto.randomBytes(4).toString("hex"); // 8 hex chars
  const suffix = String(crypto.randomInt(10, 100));   // 2 digits
  return part + suffix;
}

usersRouter.use(requireAuth);

// Anyone in the org can list users (so the UI can show who's who).
usersRouter.get("/", async (req, res) => {
  const { organizationId } = req.session!;
  const users = await prisma.user.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  res.json({ users });
});

// Only ADMIN can create new users in the org.
usersRouter.post("/", requireRole("ADMIN"), async (req, res) => {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { email, role } = parsed.data;
  const { organizationId } = req.session!;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, role, organizationId },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  // tempPassword is returned once so the admin can share it with the new user.
  // It is never stored in plain text and cannot be retrieved again.
  res.status(201).json({ user, tempPassword });
});

// Only ADMIN can change roles.
usersRouter.patch("/:id", requireRole("ADMIN"), async (req, res) => {
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { organizationId, userId } = req.session!;
  const target = await prisma.user.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!target) return res.status(404).json({ error: "User not found" });

  // Prevent removing the last ADMIN.
  if (target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { organizationId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return res.status(400).json({ error: "Cannot demote the last admin" });
    }
  }

  // Prevent demoting yourself if you're the only admin (defensive — covered above too).
  if (target.id === userId && target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { organizationId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return res.status(400).json({ error: "You cannot demote yourself as the last admin" });
    }
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  res.json({ user: updated });
});

// Only ADMIN can delete users. Cannot delete self, cannot delete last admin.
usersRouter.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  const { organizationId, userId } = req.session!;
  if (req.params.id === userId) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }
  const target = await prisma.user.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!target) return res.status(404).json({ error: "User not found" });

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { organizationId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return res.status(400).json({ error: "Cannot delete the last admin" });
    }
  }

  await prisma.user.delete({ where: { id: target.id } });
  res.json({ ok: true });
});
