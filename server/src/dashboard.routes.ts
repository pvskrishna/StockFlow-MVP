import { Router } from "express";
import { prisma } from "./db.js";
import { requireAuth } from "./auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req, res) => {
  const { organizationId } = req.session!;
  const [org, products] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.product.findMany({ where: { organizationId } }),
  ]);
  const defaultThreshold = org?.defaultLowStockThreshold ?? 5;
  const totalProducts = products.length;
  const totalQuantity = products.reduce((s, p) => s + p.quantityOnHand, 0);
  const lowStock = products
    .filter((p) => p.quantityOnHand <= (p.lowStockThreshold ?? defaultThreshold))
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      quantityOnHand: p.quantityOnHand,
      lowStockThreshold: p.lowStockThreshold ?? defaultThreshold,
      usesDefaultThreshold: p.lowStockThreshold == null,
    }));
  res.json({
    organizationName: org?.name,
    defaultLowStockThreshold: defaultThreshold,
    totalProducts,
    totalQuantity,
    lowStock,
  });
});
