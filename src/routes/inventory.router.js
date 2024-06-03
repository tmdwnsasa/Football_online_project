import express from "express";
import { playerPrisma, accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 선수 뽑기 API */
router.post("/gatcha", authMiddleware, async (req, res, next) => {
  try {
    const randomId = Math.floor(Math.random() * 30);
    const playerGatcha = await playerPrisma.player.findFirst({
      where: {
        // level이 1인 player를 랜덤으로 선정
        player_id: randomId,
        level: 1,
      },
    });
    const print = {
      name: playerGatcha.name,
      speed: playerGatcha.speed,
      goal_decision: playerGatcha.goal_decision,
      shoot_power: playerGatcha.shoot_power,
      defense: playerGatcha.defense,
      stamina: playerGatcha.stamina,
    };

    // gatcha에서 player_id랑 level을 뽑아서 player_inventory에 넣는다.
    await accountPrisma.player_inventory.create({
      data: {
        account_id: req.account.account_id,
        player_id: playerGatcha.player_id,
        level: playerGatcha.level,
      },
    });

    return res.status(201).json({ print, message: "가챠!" });
  } catch (err) {
    next(err);
  }
});

export default router;
