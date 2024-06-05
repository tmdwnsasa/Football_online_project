import express from "express";
import { playerPrisma, accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 선수 가챠 API */
router.post("/gatcha", authMiddleware, async (req, res, next) => {
  try {
    const { account_id } = req.account;
    const randomId = Math.floor(Math.random() * 30);
    const playerGatcha = await playerPrisma.player.findFirst({
      where: {
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

    const myAccount = await accountPrisma.account.findFirst({
      where: {
        account_id: +account_id,
      },
    });

    // 캐시 부족 확인
    if (myAccount.cash < 5000) {
      return res.status(400).json({ message: "캐시가 부족합니다." });
    }

    await accountPrisma.$transaction(async (tx) => {
      await tx.account.update({
        where: {
          account_id: +account_id,
        },
        data: {
          cash: myAccount.cash - 5000,
        },
      });
      await tx.player_inventory.create({
        data: {
          account_id: +account_id,
          player_id: playerGatcha.player_id,
          level: playerGatcha.level,
        },
      });
    });
    const updateAccount = await accountPrisma.account.findFirst({
      where: {
        account_id: +account_id,
      },
    });
    return res.status(201).json({ print, message: `보유 캐시 : ${updateAccount.cash}` });
  } catch (err) {
    next(err);
  }
});

/* 선수 인벤토리 확인 API */
router.get("/inventory", authMiddleware, async (req, res, next) => {
  try {
    const { account_id } = req.account;
    const inventoryArray = await accountPrisma.player_inventory.findMany({
      where: {
        account_id: +account_id,
      },
      select: {
        player_id: true,
        level: true,
      },
    });
    const array = inventoryArray.map(({ player_id, level }) => [player_id, level]);
    const playerData = [];

    for (const [player_id, level] of array) {
      playerData.push(
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
    playerData.sort((a, b) => a.player_id - b.player_id);
    return res.status(200).json({ playerData });
  } catch (err) {
    next(err);
  }
});

/* 선수 강화 API */
router.post("/upgrade", authMiddleware, async (req, res, next) => {
  try {
    const { account_id } = req.account;
    const { player_id, level } = req.body;

    const isExistPlayer = await accountPrisma.player_inventory.findMany({
      where: {
        account_id: +account_id,
        player_id: +player_id,
        level,
      },
    });
    if (isExistPlayer.length === 0) {
      return res.status(404).json({ message: "인벤에 선수가 없습니다" });
    }
    if (isExistPlayer.length === 1) {
      return res.status(400).json({ message: "인벤에 선수가 한명밖에 없습니다." });
    }
    if (level === 8) {
      return res.status(400).json({ message: "이미 선수가 최대로 강화되었습니다." });
    }
    if (level > 8) {
      return res.status(404).json({ message: "강화는 8강이 최대입니다." });
    }

    const accountCash = await accountPrisma.account.findFirst({
      where: {
        account_id: +account_id,
      },
      select: {
        cash: true,
      },
    });
    if (accountCash.cash < 1000 * (level + 1)) {
      return res.status(400).json({ message: "돈이 부족합니다." });
    }

    const upgradePlayer = await accountPrisma.$transaction(async (tx) => {
      for (let i = 0; i < 2; i++) {
        await tx.player_inventory.delete({
          where: {
            player_inventory_id: isExistPlayer[i].player_inventory_id,
            player_id: +player_id,
            level,
          },
        });
      }

      await tx.account.update({
        where: {
          account_id: +account_id,
        },
        data: {
          cash: accountCash.cash - 1000 * (level + 1),
        },
      });

      const upgradePlayer = await tx.player_inventory.create({
        data: {
          account_id: +account_id,
          player_id: +player_id,
          level: level + 1,
        },
      });
      return upgradePlayer;
    });
    const updateAccount = await accountPrisma.account.findFirst({
      where: {
        account_id: +account_id,
      },
    });
    const data = await playerPrisma.player.findFirst({
      where: {
        player_id: upgradePlayer.player_id,
        level: upgradePlayer.level,
      },
      select: {
        level: true,
        name: true,
        speed: true,
        goal_decision: true,
        shoot_power: true,
        defense: true,
        stamina: true,
      },
    });
    return res.status(201).json({ data, message: `보유 캐시 : ${updateAccount.cash}` });
  } catch (err) {
    next(err);
  }
});

/* 선수 방출 API */
router.delete("/release", authMiddleware, async (req, res, next) => {
  try {
    const { account_id } = req.account;
    const { player } = req.body;

    for (const { player_id, level } of player) {
      await accountPrisma.$transaction(async (tx) => {
        const myAccount = await tx.account.findFirst({
          where: {
            account_id: +account_id,
          },
        });

        const isExistPlayer = await tx.player_inventory.findFirst({
          where: {
            account_id: +account_id,
            player_id: +player_id,
            level: +level,
          },
        });

        if (!isExistPlayer) {
          return res.status(404).json({ message: "선수 보관함에 해당 선수가 없습니다" });
        }

        await tx.player_inventory.delete({
          where: {
            player_inventory_id: isExistPlayer.player_inventory_id,
            account_id: +account_id,
            player_id: +player_id,
            level: +level,
          },
        });

        await tx.account.update({
          where: {
            account_id: +account_id,
          },
          data: {
            cash: myAccount.cash + 1000 * isExistPlayer.level,
          },
        });
      });
    }

    const updateAccount = await accountPrisma.account.findFirst({
      where: {
        account_id: +account_id,
      },
    });

    return res.status(200).json({ message: `보유 캐시 : ${updateAccount.cash}` });
  } catch (err) {
    next(err);
  }
});

export default router;
