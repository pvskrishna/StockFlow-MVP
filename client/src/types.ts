export type Role = "ADMIN" | "MANAGER" | "GUEST";
export const ROLES: Role[] = ["ADMIN", "MANAGER", "GUEST"];

export type User = { id: string; email: string; organizationId: string; role: Role };

export type OrgUser = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
};
export type Organization = {
  id: string;
  name: string;
  defaultLowStockThreshold: number;
};
export type Product = {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  description: string | null;
  quantityOnHand: number;
  costPrice: number | null;
  sellingPrice: number | null;
  lowStockThreshold: number | null;
  lastUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};
export type DashboardData = {
  organizationName: string;
  defaultLowStockThreshold: number;
  totalProducts: number;
  totalQuantity: number;
  lowStock: Array<{
    id: string;
    name: string;
    sku: string;
    quantityOnHand: number;
    lowStockThreshold: number;
    usesDefaultThreshold: boolean;
  }>;
};
