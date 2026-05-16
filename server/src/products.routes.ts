import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./db.js";
import { requireAuth, requireRole } from "./auth.js";
import {
  productCreateSchema,
  productUpdateSchema,
  stockAdjustSchema,
} from "./validation.js";

export const productsRouter = Router();

productsRouter.use(requireAuth);

// All authenticated users (ADMIN, MANAGER, GUEST) can read.
// ADMIN + MANAGER can create/update/adjust. ADMIN only can delete.
const canWrite = requireRole("ADMIN", "MANAGER");
const canDelete = requireRole("ADMIN");

productsRouter.get("/", async (req, res) => {
  const { organizationId } = req.session!;
  const search = (req.query.q as string | undefined)?.trim();
  const where: Prisma.ProductWhereInput = { organizationId };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
    ];
  }
  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  res.json({ products });
});

productsRouter.post("/", canWrite, async (req, res) => {
  const parsed = productCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { organizationId, email } = req.session!;

  const dup = await prisma.product.findUnique({
    where: { organizationId_sku: { organizationId, sku: parsed.data.sku } },
  });
  if (dup) return res.status(409).json({ error: "SKU already exists" });

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      description: parsed.data.description ?? null,
      organizationId,
      lastUpdatedBy: email,
    },
  });
  res.status(201).json({ product });
});

async function findOwned(id: string, organizationId: string) {
  return prisma.product.findFirst({ where: { id, organizationId } });
}

productsRouter.get("/:id", async (req, res) => {
  const product = await findOwned(req.params.id, req.session!.organizationId);
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json({ product });
});

productsRouter.put("/:id", canWrite, async (req, res) => {
  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { organizationId, email } = req.session!;
  const product = await findOwned(req.params.id, organizationId);
  if (!product) return res.status(404).json({ error: "Not found" });

  if (parsed.data.sku && parsed.data.sku !== product.sku) {
    const dup = await prisma.product.findUnique({
      where: { organizationId_sku: { organizationId, sku: parsed.data.sku } },
    });
    if (dup) return res.status(409).json({ error: "SKU already exists" });
  }

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { ...parsed.data, lastUpdatedBy: email },
  });
  res.json({ product: updated });
});

productsRouter.delete("/:id", canDelete, async (req, res) => {
  const product = await findOwned(req.params.id, req.session!.organizationId);
  if (!product) return res.status(404).json({ error: "Not found" });
  await prisma.product.delete({ where: { id: product.id } });
  res.json({ ok: true });
});

productsRouter.post("/:id/adjust", canWrite, async (req, res) => {
  const parsed = stockAdjustSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { organizationId, email } = req.session!;
  const product = await findOwned(req.params.id, organizationId);
  if (!product) return res.status(404).json({ error: "Not found" });

  const next = product.quantityOnHand + parsed.data.delta;
  if (next < 0) return res.status(400).json({ error: "Quantity cannot go below zero" });

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { quantityOnHand: next, lastUpdatedBy: email },
  });
  res.json({ product: updated });
});
