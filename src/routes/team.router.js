import express from "express";
import { accountPrisma, playerPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 팀원 확인 API */
router.get("/team/:account_id", async (req, res, next) => {
  try {
    const account_id = req.params.account_id;

    const teamArr = await accountPrisma.account_team.findMany({
      where: {
        account_id: +account_id,
      },
      select: {
        player_id: true,
        level: true,
      },
    });

    const array = teamArr.map(({ player_id, level }) => [player_id, level]);
    const myTeam = [];

    for (const [player_id, level] of array) {
      myTeam.push(
        await playerPrisma.player.findFirst({
          where: {
            player_id: player_id,
            level: level,
          },
          select: {
            player_id: true,
            name: true,
            level: true,
          },
        }),
      );
    }
    myTeam.sort((a, b) => a.player_id - b.player_id);

    return res.status(200).json({ myTeam });
  } catch (err) {
    next(err);
  }
});

/* 팀원 배치 API */
router.post("/team", authMiddleware, async (req, res, next) => {
  try {
    const { player_id, level } = req.body;
    const account_id = req.account.account_id;

    const teamArr = await accountPrisma.account_team.findMany({
      where: {
        account_id: account_id,
      },
    });

    const inven = await accountPrisma.player_inventory.findFirst({
      where: {
        account_id,
        player_id,
        level,
      },
    });

    if (!inven) return res.status(404).json({ message: "없는 플레이어는 배치될 수 없습니다." });

    if (teamArr.length >= 3)
      return res.status(400).json({ message: "3명 이상은 배치할 수 없습니다." });

    for (const data of teamArr) {
      if (data.player_id === player_id) {
        return res.status(400).json({ message: "같은 플레이어는 배치될 수 없습니다." });
      }
    }

    //여러가지 행동을 할 때 뭐는 되고 뭐는 안되고 하는 상황이 나오면 안될 때
    const print = await accountPrisma.$transaction(async (tx) => {
      const data = await tx.account_team.create({
        data: {
          account_id,
          player_id,
          level,
        },
      });

      await tx.player_inventory.delete({
        where: {
          player_inventory_id: inven.player_inventory_id,
          player_id,
          level,
        },
      });

      return data;
    });

    const playerName = await playerPrisma.player.findFirst({
      where: {
        player_id,
      },
      select: {
        name: true,
      },
    });

    return res.status(201).json({
      data: {
        player_id: print.player_id,
        level: print.level,
      },
      message: `플레이어 [${playerName.name}](이)가 배치되었습니다.`,
    });
  } catch (err) {
    next(err);
  }
});

/* 팀원 해제 API */
router.delete("/team", authMiddleware, async (req, res, next) => {
  try {
    const { player_id, level } = req.body;
    const account_id = req.account.account_id;

    const teamArr = await accountPrisma.account_team.findMany({
      where: {
        account_id,
      },
    });

    const checkSamePlayer = [];

    for (const data of teamArr) {
      if (data.player_id === player_id && data.level === level) {
        checkSamePlayer.push(data);
      }
    }

    if (teamArr.length === 0) {
      return res.status(400).json({ message: "팀에 남은 팀원이 없습니다." });
    }

    if (checkSamePlayer.length === 0) {
      return res.status(400).json({ message: "팀에 해당 플레이어가 없습니다." });
    }

    const print = await accountPrisma.$transaction(async (tx) => {
      await tx.account_team.deleteMany({
        where: {
          account_id,
          player_id,
          level,
        },
      });

      await tx.player_inventory.create({
        data: {
          account_id,
          player_id,
          level,
        },
      });

      return {
        player_id,
        level,
      };
    });

    const playerName = await playerPrisma.player.findFirst({
      where: {
        player_id,
      },
      select: {
        name: true,
      },
    });

    return res.status(200).json({
      data: {
        player_id: print.player_id,
        level: print.level,
      },
      message: `플레이어 [${playerName.name}](이)가 해제되었습니다.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
