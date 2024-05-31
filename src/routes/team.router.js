import express from "express";
import { accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware";

const router = express.Router();

//장착이 됬으면 인벤에서 빠진다.
router.post("/team", authMiddleware, async (req, res, next) => {
  try {
    const { player_id, level } = req.body;
    const autherId = req.account.account_id;

    const teamArr = await accountPrisma.account_team.findMany({
      where: {
        account_id: autherId,
      },
    });

    if (teamArr.length >= 3)
      return res.status(400).json({ message: "3명 이상은 배치할 수 없습니다." });

    for (const data of teamArr) {
      if (data.player_id === data.player_id) {
        return res.status(400).json({ message: "같은 플레이어는 배치될 수 없습니다." });
      }
    }

    const print = await accountPrisma.$transaction(async (tx) => {
      await tx.account_team.create({
        data: {
          account_id: req.account.account_id,
          player_id,
        },
      });

      const data = await tx.player_inventory.delete({
        where: {
          player_id,
          level,
        },
      });

      return data;
    });

    return res.status(201).json({ print });
  } catch (err) {
    next(err);
  }
});

export default router;
