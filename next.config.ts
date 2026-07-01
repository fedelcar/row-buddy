import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (the zero-setup local dev database) ships WASM assets that must
  // stay external to the server bundle. Unused in production, where
  // DATABASE_URL points at Neon.
  serverExternalPackages: ["@electric-sql/pglite"],
  // The app migrates itself on first boot; the SQL files must ship with
  // every server function.
  outputFileTracingIncludes: {
    "/*": ["./drizzle/**/*"],
  },
};

export default nextConfig;
