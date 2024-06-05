import express from "express";
import { playerPrisma, accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

//상품 전체 검색
router.get("/auction", async (req, res) => {
  const auctionArr = await playerPrisma.auction.findMany({
    select: {
      auction_id: true,
      player_id: true,
      level: true,
      cash: true,
    },
  });

  const idArr = auctionArr.map(({ player_id }) => player_id);

  const playerArr = await playerPrisma.player.findMany({
    where: {
      player_id: {
        in: idArr,
      },
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

  let datas = [];

  for (let i = 0; i < auctionArr.length; i++) {
    datas.push({ ...auctionArr[i], ...playerArr[i] });
  }

  return res.status(200).json({ datas });
});

//상품 이름 검색
router.get("/auction/:name", async (req, res) => {
  const name = req.params.name;

  const player_id = await playerPrisma.player.findMany({
    where: {
      name,
    },
    select: {
      player_id,
    },
  });

  const auctionArr = await playerPrisma.auction.findMany({
    where: {
      player_id,
    },
    select: {
      auction_id: true,
      player_id: true,
      level: true,
      cash: true,
    },
  });

  const idArr = auctionArr.map(({ player_id, level }) => {
    [player_id, level];
  });

  const playerArr = await playerPrisma.player.findMany({
    where: {
      player_id: {
        in: idArr.player_id,
      },
      level: {
        in: idArr.level,
      },
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

  let datas = [];

  for (let i = 0; i < auctionArr.length; i++) {
    datas.push({ ...auctionArr[i], ...playerArr[i] });
  }

  return res.status(200).json({ datas });
});

//상품 등록
router.post("/auction", authMiddleware, async (req, res, next) => {
  const { player_id, level, cash } = req.body;
  const account_id = req.account.account_id;

  if (!player_id || !level || !cash) {
    return res.status(400).json({ message: "값이 충분히 입력되지 않았습니다." });
  }

  const data = await accountPrisma.player_inventory.findFirst({
    where: {
      player_id,
      level,
    },
  });

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
});

//상품 구매
router.delete("/auction/:auction_id", authMiddleware, async (req, res, next) => {
  const auction_id = +req.params.auction_id;
  const account_id = req.account.account_id;

  const data = await accountPrisma.auction.findFirst({
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
      player_id,
      level,
      account_id,
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

  await accountPrisma.auction.delete({
    where: {
      auction_id,
    },
  });

  return res.status(200).json({ auctionPlayer });
});

//상품 취소
router.delete("/auctioncancel/:auction_id", authMiddleware, async (req, res, next) => {
  const auction_id = +req.params.auction_id;
  const account_id = req.account.account_id;

  const data = await accountPrisma.auction.findFirst({
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
      player_id,
      level,
      account_id,
    },
  });

  await accountPrisma.auction.delete({
    where: {
      auction_id,
    },
  });

  return res.status(200).json({ auctionPlayer });
});

export default router;

/////////
//Insomnia 확인 해야 합니다.
/////////