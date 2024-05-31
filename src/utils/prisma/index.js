import { PrismaClient } from "@prisma/client";

export const Prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],

  errorFormat: "pretty",
});
