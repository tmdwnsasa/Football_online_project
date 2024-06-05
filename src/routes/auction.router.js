import express from "express";
import { playerPrisma, accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

//상품 전체 검색
router.get("/auction", async (req, res, next) => {
  try {
    const auctionArr = await playerPrisma.auction.findMany({
      select: {
        auction_id: true,
        player_id: true,
        level: true,
        cash: true,
      },
    });

    const playerArr = [];

    for (const { player_id, level } of auctionArr) {
      const playerInfo = await playerPrisma.player.findFirst({
        where: {
          player_id: player_id,
          level: level,
        },
        select: {
          name: true,
          speed: true,
          goal_decision: true,
          shoot_power: true,
          defense: true,
          stamina: true,
        },
      });
      playerArr.push(playerInfo);
    }

    let datas = [];

    for (let i = 0; i < auctionArr.length; i++) {
      datas.push({
        level: auctionArr[i].level,
        cash: auctionArr[i].cash,
        name: playerArr[i].name,
        speed: playerArr[i].speed,
        goal_decision: playerArr[i].goal_decision,
        shoot_power: playerArr[i].shoot_power,
        defense: playerArr[i].defense,
        stamina: playerArr[i].stamina,
      });
    }

    return res.status(200).json({ datas });
  } catch (err) {
    next(err);
  }
});

//상품 이름 검색
router.get("/auction/:name", async (req, res) => {
  try {
    const name = req.params.name;

    const player_name = await playerPrisma.player.findMany({
      where: {
        name,
      },
      select: {
        player_id: true,
        level: true,
      },
    });

    const auctionArr = await playerPrisma.auction.findMany({
      where: {
        player_id: player_name[0].player_id,
      },
      select: {
        auction_id: true,
        player_id: true,
        level: true,
        cash: true,
      },
    });

    const playerArr = [];

    for (const { player_id, level } of auctionArr) {
      const playerInfo = await playerPrisma.player.findFirst({
        where: {
          player_id: player_id,
          level: level,
        },
        select: {
          name: true,
          speed: true,
          goal_decision: true,
          shoot_power: true,
          defense: true,
          stamina: true,
        },
      });
      playerArr.push(playerInfo);
    }

    let datas = [];

    for (let i = 0; i < auctionArr.length; i++) {
      datas.push({
        level: auctionArr[i].level,
        cash: auctionArr[i].cash,
        name: playerArr[i].name,
        speed: playerArr[i].speed,
        goal_decision: playerArr[i].goal_decision,
        shoot_power: playerArr[i].shoot_power,
        defense: playerArr[i].defense,
        stamina: playerArr[i].stamina,
      });
    }
    return res.status(200).json({ datas });
  } catch (err) {
    next(err);
  }
});

/* 상품 등록 API */
router.post("/auction", authMiddleware, async (req, res, next) => {
  try {
    const { player_id, level, cash } = req.body;
    const account_id = req.account.account_id;

    if (
      // player_id, cash가 0일 경우를 허용
      player_id === undefined ||
      player_id === null ||
      !level ||
      cash === undefined ||
      cash === null
    ) {
      return res.status(400).json({ message: "값이 충분히 입력되지 않았습니다." });
    }

    const data = await accountPrisma.player_inventory.findFirst({
      where: {
        player_id,
        level,
      },
    });

    if (!data) {
      return res.status(404).json({ message: "선수 인벤토리에 해당 선수가 없습니다." });
    }

    await accountPrisma.player_inventory.delete({
      where: {
        player_inventory_id: data.player_inventory_id,
      },
    });

    const auctionPlayer = await playerPrisma.auction.create({
      data: {
        player_id,
        level,
        cash,
        account_id,
      },
    });

    return res.status(200).json({ auctionPlayer });
  } catch (err) {
    next(err);
  }
});

/* 상품 구매 */
router.delete("/auction/:auction_id", authMiddleware, async (req, res, next) => {
  try {
    const auction_id = +req.params.auction_id;
    const account_id = req.account.account_id;

    const data = await playerPrisma.auction.findFirst({
      where: {
        auction_id,
      },
    });

    const buyer = await accountPrisma.account.findFirst({
      where: {
        account_id,
      },
    });

    const seller = await accountPrisma.account.findFirst({
      where: {
        account_id: data.account_id,
      },
    });

    if (!data) {
      return res.status(404).json({ message: "없는 제품은 구매할 수 없습니다." });
    }

    if (buyer.cash < data.cash) {
      return res.status(400).json({ message: "소지금이 부족합니다." });
    }

    const auctionPlayer = await accountPrisma.player_inventory.create({
      data: {
        player_id: data.player_id,
        level: data.level,
        account_id: data.account_id,
      },
    });

    await accountPrisma.account.update({
      where: {
        account_id: seller.account_id,
      },
      data: {
        cash: seller.cash + data.cash,
      },
    });

    await accountPrisma.account.update({
      where: {
        account_id: buyer.account_id,
      },
      data: {
        cash: buyer.cash - data.cash,
      },
    });

    await playerPrisma.auction.delete({
      where: {
        auction_id,
      },
    });

    const playerName = await playerPrisma.player.findFirst({
      where: {
        player_id: data.player_id,
      },
      select: {
        name: true,
      },
    });

    return res.status(200).json({
      data: {
        player_id: auctionPlayer.player_id,
        level: auctionPlayer.level,
      },
      message: `플레이어 [${playerName.name}]을/를 구매하였습니다.`,
    });
  } catch (err) {
    next(err);
  }
});

/* 상품 취소 */
router.delete("/auctioncancel/:auction_id", authMiddleware, async (req, res, next) => {
  try {
    const auction_id = +req.params.auction_id;
    const account_id = req.account.account_id;

    const data = await playerPrisma.auction.findFirst({
      where: {
        auction_id,
      },
    });

    if (data.account_id !== account_id)
      return res.status(400).json({ message: "본인 물건이 아니면 취소할 수 없습니다." });
    if (!data) {
      return res.status(404).json({ message: "없는 제품은 취소할 수 없습니다." });
    }

    const auctionPlayer = await accountPrisma.player_inventory.create({
      data: {
        player_id: data.player_id,
        level: data.level,
        account_id: data.account_id,
      },
    });

    await playerPrisma.auction.delete({
      where: {
        auction_id,
      },
    });

    const playerName = await playerPrisma.player.findFirst({
      where: {
        player_id: data.player_id,
      },
      select: {
        name: true,
      },
    });

    return res.status(200).json({
      data: {
        player_id: auctionPlayer.player_id,
        level: auctionPlayer.level,
      },
      message: `플레이어 [${playerName.name}]을/를 회수하였습니다.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;