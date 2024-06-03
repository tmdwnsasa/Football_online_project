import express from "express";
import { accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 나만의 팀 꾸리기 API */
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
      if (data.player_id === player_id) {
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

      const data = await tx.player_inventory.deleteMany({
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