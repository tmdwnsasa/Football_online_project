import { PrismaClient as accountClient } from "../../../prisma/accountClient/default.js";
import { PrismaClient as characterClient } from "../../../prisma/characterClient/default.js";

export const accountPrisma = new accountClient({
  log: ["query", "info", "warn", "error"],

  errorFormat: "pretty",
});

export const characterPrisma = new characterClient({
  log: ["query", "info", "warn", "error"],

  errorFormat: "pretty",
});
