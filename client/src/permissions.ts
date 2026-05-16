import type { Role } from "./types";

export const can = {
  writeProducts: (role?: Role) => role === "ADMIN" || role === "MANAGER",
  deleteProducts: (role?: Role) => role === "ADMIN",
  editSettings: (role?: Role) => role === "ADMIN",
  manageUsers: (role?: Role) => role === "ADMIN",
};
