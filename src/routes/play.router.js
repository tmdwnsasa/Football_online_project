import express from "express";
import { accountPrisma } from "../utils/prisma/index.js";
import { playerPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 축구 게임, 게임 점수 조정 API */
router.get("/match", authMiddleware, async (req, res, next) => {
  try {
    const { account_id } = req.account;

    // 내 계정 찾기
    const myAccount = await accountPrisma.rank.findFirst({
      where: {
        account_id: account_id,
      },
    });

    // 내 팀 선수들 정보 가져오기
    const myTeam = await accountPrisma.account_team.findMany({
      where: {
        account_id,
      },
      select: {
        player_id: true,
      },
    });

    if (myTeam.length != 3) {
      return res.status(400).json({ message: "팀 배치 선수가 3명이 아닙니다." });
    }

    // 매치메이킹
    // 매치 가능하고 3명을 배치한 유저들 정보 가져오기
    const matchAccountArr = await accountPrisma.account_team.groupBy({
      by: ["account_id"],
      _count: {
        account_id: true,
      },
      having: {
        account_id: {
          _count: {
            equals: 3,
          },
        },
      },
      select: {
        account_id: true,
      },
    });

    if (matchAccountArr.length === 1) {
      return res.status(400).json({ message: "상대방이 없습니다." });
    }

    const matchAccountIdArr = matchAccountArr.map(({ account_id }) => account_id);

    const scoreArr = await accountPrisma.rank.findMany({
      where: {
        account_id: {
          in: matchAccountIdArr,
        },
      },
      select: {
        score: true,
        account_id: true,
      },
      orderBy: {
        score: "asc",
      },
    });

    const enemyAccountArr = [];

    for (let i = 0; i < scoreArr.length; i++) {
      if (scoreArr[i].account_id === account_id) {
        for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
          enemyAccountArr.push(scoreArr[j].account_id);
        }
        for (let j = i + 1; j < scoreArr.length && j <= i + 3; j++) {
          enemyAccountArr.push(scoreArr[j].account_id);
        }
      }
    }

    const enemyAccountId = enemyAccountArr[Math.floor(Math.random() * enemyAccountArr.length)];

    // 상대방 계정 찾기
    const enemyAccount = await accountPrisma.account.findFirst({
      where: {
        account_id: enemyAccountId,
      },
    });

    // 상대 팀 선수들 정보 가져오기
    const enemyTeam = await accountPrisma.account_team.findMany({
      where: {
        account_id: enemyAccount.account_id,
      },
      select: {
        player_id: true,
      },
    });

    // 가중치 설정
    const weights = {
      speed: 0.25,
      goalDecision: 0.15,
      shootPower: 0.2,
      defense: 0.25,
      stamina: 0.15,
    };

    // 내 팀의 선수 정보 가져오기
    const myTeamPlayerIds = myTeam.map(({ player_id }) => player_id);
    const myTeamPlayers = await playerPrisma.player.findMany({
      where: { player_id: { in: myTeamPlayerIds } },
      select: {
        speed: true,
        goal_decision: true,
        shoot_power: true,
        defense: true,
        stamina: true,
      },
    });

    // 내 팀의 총 점수 구하기
    const myTeamtotalScore = myTeamPlayers.reduce((total, player) => {
      const playerScore =
        player.speed * weights.speed +
        player.goal_decision * weights.goalDecision +
        player.shoot_power * weights.shootPower +
        player.defense * weights.defense +
        player.stamina * weights.stamina;
      return total + playerScore;
    }, 0);

    // 상대 팀의 선수 정보 가져오기
    const enemyTeamPlayerIds = enemyTeam.map(({ player_id }) => player_id);
    const enemyPlayers = await playerPrisma.player.findMany({
      where: { player_id: { in: enemyTeamPlayerIds } },
      select: {
        speed: true,
        goal_decision: true,
        shoot_power: true,
        defense: true,
        stamina: true,
      },
    });

    // 상대 팀의 총 점수 구하기
    const enemyTeamTotalScore = enemyPlayers.reduce((total, player) => {
      const playerScore =
        player.speed * weights.speed +
        player.goal_decision * weights.goalDecision +
        player.shoot_power * weights.shootPower +
        player.defense * weights.defense +
        player.stamina * weights.stamina;
      return total + playerScore;
    }, 0);

    // 승패 결정 로직
    const scoreDifference = myTeamtotalScore - enemyTeamTotalScore;
    const influence = Math.sqrt(Math.abs(scoreDifference)) * (scoreDifference > 0 ? 1 : -1); // 점수차에 따른 가중치
    const randomFactor = Math.random() * 50 - 25; // -25 ~ 25

    const finalScore = randomFactor + influence; // 랜덤값과 가중치를 더한 값

    let result, newScore;

    // 현재 나의 게임 점수
    const myScore = await accountPrisma.rank.findFirst({
      where: { account_id: myAccount.account_id },
    });

    // 상대방 게임 점수
    const enemyScore = await accountPrisma.rank.findFirst({
      where: { account_id: enemyAccount.account_id },
    });

    const updateScore = [myScore, enemyScore];

    if (finalScore > 5) {
      const ourGoals = Math.floor(Math.random() * 4) + 2;
      const theirGoals = Math.floor(Math.random() * Math.min(3, ourGoals));
      result = `승리! [${req.account.nickname}] ${ourGoals} - ${theirGoals} [${enemyAccount.nickname}]`;
      newScore = myScore.score + 10;

      await accountPrisma.rank.update({
        where: {
          rank_id: myScore.rank_id,
          account_id: myAccount.account_id,
        },
        data: {
          win: myScore.win + 1,
          score: myScore.score + 10,
        },
      });

      await accountPrisma.rank.update({
        where: {
          rank_id: enemyScore.rank_id,
          account_id: enemyAccount.account_id,
        },
        data: {
          lose: enemyScore.lose + 1,
          score: enemyScore.score - 10,
        },
      });
    } else if (finalScore < -5) {
      const theirGoals = Math.floor(Math.random() * 4) + 2;
      const ourGoals = Math.floor(Math.random() * Math.min(3, theirGoals));
      result = `패배... [${req.account.nickname}] ${ourGoals} - ${theirGoals} [${enemyAccount.nickname}]`;
      newScore = myScore.score - 10;

      await accountPrisma.rank.update({
        where: {
          rank_id: myScore.rank_id,
          account_id: myAccount.account_id,
        },
        data: {
          lose: myScore.lose + 1,
          score: myScore.score - 10,
        },
      });

      await accountPrisma.rank.update({
        where: {
          rank_id: enemyScore.rank_id,
          account_id: enemyAccount.account_id,
        },
        data: {
          win: enemyScore.win + 1,
          score: enemyScore.score + 10,
        },
      });
    } else {
      const goals = Math.floor(Math.random() * 3) + 1;
      result = `무승부! [${req.account.nickname}] ${goals} - ${goals} [${enemyAccount.nickname}]`;
      newScore = myScore.score;

      for (const account of updateScore) {
        await accountPrisma.rank.update({
          where: {
            rank_id: account.rank_id,
            account_id: account.account_id,
          },
          data: {
            draw: account.draw + 1,
          },
        });
      }
    }

    return res.status(201).json({ result, score: newScore });
  } catch (err) {
    next(err);
  }
});

export default router;
