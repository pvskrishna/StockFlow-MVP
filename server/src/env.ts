import "dotenv/config";

const required = (k: string, fallback?: string) => {
  const v = process.env[k] ?? fallback;
  if (!v) throw new Error(`Missing required env var ${k}`);
  return v;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: required("JWT_SECRET"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
