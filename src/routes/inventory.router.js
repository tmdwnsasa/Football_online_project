import express from "express";
import { playerPrisma, accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 선수 뽑기 API */
router.post("/gatcha", authMiddleware, async (req, res, next) => {
  try {
    const { account_id } = req.account;
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
    // 트랜잭션, create-update
    const myAccount = await accountPrisma.account.findFirst({
      where: {
        account_id: +account_id,
      },
    });
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

    return res.status(201).json({ print });
  } catch (err) {
    next(err);
  }
});

//강화를 위한 인벤토리에 플레이어 확인
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
          orderBy: {
            player_id: "asc",
          },
        }),
      );
    }
    // console.log(array);
    return res.status(200).json({ playerData });
  } catch (err) {
    next(err);
  }
});
// 받아올 것 : player_id, level req.body
//예외처리, 없는 캐릭터, 인벤에 없다, 레벨이 이미 최대, 돈이 없다.

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
    //돈
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

    //트랙잭션
    // 실행 되면 인벤에서 같은 캐릭터 2개를 delete
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

      // 돈을 감소
      await tx.account.update({
        where: {
          account_id: +account_id,
        },
        data: {
          cash: accountCash.cash - 1000 * (level + 1),
        },
      });

      // 캐릭터 레벨 오른거 create
      const upgradePlayer = await tx.player_inventory.create({
        data: {
          account_id: +account_id,
          player_id: +player_id,
          level: level + 1,
        },
      });
      return upgradePlayer;
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
    return res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
