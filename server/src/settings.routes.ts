import { Router } from "express";
import { prisma } from "./db.js";
import { requireAuth, requireRole } from "./auth.js";
import { settingsSchema } from "./validation.js";

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get("/", async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.session!.organizationId },
  });
  if (!org) return res.status(404).json({ error: "Not found" });
  res.json({
    organizationName: org.name,
    defaultLowStockThreshold: org.defaultLowStockThreshold,
  });
});

settingsRouter.put("/", requireRole("ADMIN"), async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const org = await prisma.organization.update({
    where: { id: req.session!.organizationId },
    data: { defaultLowStockThreshold: parsed.data.defaultLowStockThreshold },
  });
  res.json({ defaultLowStockThreshold: org.defaultLowStockThreshold });
});
