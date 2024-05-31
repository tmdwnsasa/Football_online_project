import { PrismaClient as accountClient } from "../../../prisma/accountClient/default.js";
import { PrismaClient as playerClient } from "../../../prisma/playerClient/default.js";

export const accountPrisma = new accountClient({
  log: ["query", "info", "warn", "error"],

  errorFormat: "pretty",
});

export const playerPrisma = new playerClient({
  log: ["query", "info", "warn", "error"],

  errorFormat: "pretty",
});
