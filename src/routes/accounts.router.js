import express from "express";
import { accountPrisma } from "../utils/prisma/index.js";

const router = express.Router();

router.get("/accounts", async (req, res) => {
  const datas = await accountPrisma.account.findMany({
    select: {
      account_id: true,
    },
  });
  return res.status(200).json({ message: datas });
});

export default router;
