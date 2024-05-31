import express from "express";
import { accountPrisma } from "../utils/prisma/index.js";
import { characterPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/match", authMiddleware, async (req, res, next) => {
  try {
    const { acount_id } = req.account;

    // 내 계정 찾기
    const myAccount = await accountPrisma.account.findFirst({
      where: {
        acount_id: acount_id,
      },
    });

    // 내 계정의 점수와 비슷한 상대방 정보
    let similarAccount = await accountPrisma.account.findMany({
      where: {
        acount_id: {
          not: acount_id,
        },
        score: {
          lte: Math.floor(myAccount.score * 1.1),
          gte: Math.floor(myAccount.score * 0.9),
        },
      },
      select: {
        acount_id: true,
      },
    });

    if (!similarAccount) {
      similarAccount = await accountPrisma.account.findMany({
        where: {
          acount_id: {
            not: acount_id,
          },
        },
        select: {
          acount_id: true,
        },
      });
    }

    const similarArr = similarAccount.map(({ account_id }) => account_id);
    const enemyAccount = similarArr[Math.floor(Math.random() * similarArr.length)];

    const myTeam = await accountPrisma.account_team.findMany({
      where: {
        account_id: myAccount.acount_id,
      },
      select: {
        charater_id: true,
      },
    });

    const enemyTeam = await accountPrisma.account_team.findMany({
      where: {
        account_id: enemyAccount,
      },
      select: {
        charater_id: true,
      },
    });

    return res.status(200).json({ message: "매칭완료" });
  } catch (err) {
    next(err);
  }
});

export default router;
