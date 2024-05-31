import express from "express";
import { accountPrisma } from "../utils/prisma/index.js";
import { characterPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/games/play", authMiddleware, async (req, res, next) => {
  try {
    const { account_id } = req.user;

    // 현재 나의 게임 점수
    const currentUser = await accountPrisma.rank.findFirst({
      where: { account_id },
      select: { score: true },
    });

    // 매치 메이킹 로직 . . .

    // 가중치 설정
    const weights = {
      speed: 0.25,
      goalDecision: 0.15,
      shootPower: 0.2,
      defense: 0.25,
      stamina: 0.15,
    };

    // 내 팀 선수들 정보 가져오기
    const myTeamCharacters = await accountPrisma.account_team.findMany({
      where: { account_id },
      select: { character_id: true },
    });

    const myCharacterIds = myTeamCharacters.map(({ character_id }) => character_id);

    const myCharacters = await characterPrisma.player.findMany({
      where: { character_id: { in: myCharacterIds } },
      select: {
        speed: true,
        goal_decision: true,
        shoot_power: true,
        defense: true,
        stamina: true,
      },
    });

    const totalScore = myCharacters.reduce((total, character) => {
      const characterScore =
        character.speed * weights.speed +
        character.goal_decision * weights.goalDecision +
        character.shoot_power * weights.shootPower +
        character.defense * weights.defense +
        character.stamina * weights.stamina;
      return total + characterScore;
    }, 0);

    // 상대 팀 선수들 정보 가져오기
    const opponentTeamCharacters = await accountPrisma.account_team.findMany({
      where: { account_team_id: selectedTeam.account_team_id },
      select: { charater_id: true },
    });

    const opponentCharacterIds = opponentTeamCharacters.map(({ character_id }) => character_id);

    const opponentCharacters = await characterPrisma.player.findMany({
      where: { character_id: { in: opponentCharacterIds } },
      select: {
        speed: true,
        goal_decision: true,
        shoot_power: true,
        defense: true,
        stamina: true,
      },
    });

    const opponentScore = opponentCharacters.reduce((total, character) => {
      const characterScore =
        character.speed * weights.speed +
        character.goal_decision * weights.goalDecision +
        character.shoot_power * weights.shootPower +
        character.defense * weights.defense +
        character.stamina * weights.stamina;
      return total + characterScore;
    }, 0);

    // 승패 결정 로직 . . .
    const scoreDifference = totalScore - opponentScore;
    const influence = Math.sqrt(Math.abs(scoreDifference)) * (scoreDifference > 0 ? 1 : -1); // 점수차에 따른 가중치
    const randomFactor = Math.random() * 50 - 25; // -25 ~ 25

    const finalScore = randomFactor + influence; // 랜덤값과 가중치를 더한 값

    let result, newScore;

    if (finalScore > 10) {
      const ourGoals = Math.floor(Math.random() * 4) + 2;
      const theirGoals = Math.floor(Math.random() * Math.min(3, ourGoals));
      result = `승리! 우리팀 ${ourGoals} - ${theirGoals} 상대팀`;
      newScore = currentUser.score + 10;

      await accountPrisma.rank.create({
        data: {
          account_id,
          win: currentUser.win + 1,
          score: currentUser.score + 10,
        },
      });
    } else if (finalScore < -10) {
      const theirGoals = Math.floor(Math.random() * 4) + 2;
      const ourGoals = Math.floor(Math.random() * Math.min(3, theirGoals));
      result = `패배... 우리팀 ${ourGoals} - ${theirGoals} 상대팀`;
      newScore = currentUser.score - 10;

      await accountPrisma.rank.create({
        data: {
          account_id,
          lose: currentUser.lose + 1,
          score: currentUser.score - 10,
        },
      });
    } else {
      const goals = Math.floor(Math.random() * 3) + 1;
      result = `무승부! 우리팀 ${goals} - ${goals} 상대팀`;
      newScore = currentUser.score;

      await accountPrisma.rank.create({
        data: {
          account_id,
          draw: currentUser.draw + 1,
          score: currentUser.score,
        },
      });
    }

    return res.status(201).json({ result, score: newScore });
  } catch (err) {
    next(err);
  }
});

export default router;
