import { defineConfig } from "drizzle-kit";
import { loadEnv } from "./db/env";

loadEnv();

export default process.env.DATABASE_URL
  ? defineConfig({
      dialect: "postgresql",
      schema: "./db/schema.ts",
      out: "./drizzle",
      dbCredentials: { url: process.env.DATABASE_URL },
    })
  : defineConfig({
      dialect: "postgresql",
      driver: "pglite",
      schema: "./db/schema.ts",
      out: "./drizzle",
      dbCredentials: { url: "./.pglite" },
    });
