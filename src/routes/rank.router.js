import express from "express";
import { accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import ErrorHandlingMiddleware from "../middlewares/error-handling.middleware.js";

const router = express.Router();

/* 랭킹 조회 API */
router.get("/accounts/rank", async (req, res, next) => {
  try {
    // 승률 계산 함수
    const getOdds = (win, draw, lose) => {
      let totalGame = win + draw + lose;
      let winrates = Math.floor(((win + draw * 0.5) / totalGame) * 100);
      if (totalGame === 0) winrates = 0;
      return winrates;
    };

    const accountRank = await accountPrisma.rank.findMany({
      select: {
        account_id: true,
        score: true,
        win: true,
        draw: true,
        lose: true,
      },
      orderBy: {
        score: "desc",
      },
    });

    const response = [];

    for (const account of accountRank) {
      const accountId = await accountPrisma.account.findFirst({
        where: {
          account_id: account.account_id,
        },
        select: {
          id: true,
        },
      });

      const odds = getOdds(account.win, account.draw, account.lose);
      response.push({
        id: accountId.id,
        score: account.score,
        odds: odds,
        win: account.win,
        draw: account.draw,
        lose: account.lose,
      });
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;