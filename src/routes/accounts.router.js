import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 회원가입 API */
router.post("/accounts/sign-up", async (req, res, next) => {
  try {
    const { id, password, passwordConfirm, nickname } = req.body;

    const isExistAccount = await accountPrisma.account.findFirst({
      where: {
        id,
      },
    });

    if (isExistAccount) {
      return res.status(400).json({ message: "이미 존재하는 아이디입니다." });
    }

    const isExistNickname = await accountPrisma.account.findFirst({
      where: {
        nickname,
      },
    });

    if (isExistNickname) {
      return res.status(400).json({ message: "이미 존재하는 닉네임입니다." });
    }

    const vaildId = /^[a-z0-9]+$/;
    if (!vaildId.test(id)) {
      return res.status(400).json({ message: "아이디는 영어와 숫자만 사용할 수 있습니다." });
    }

    const vaildNickName = /^[a-z0-9가-힣]+$/;
    if (!vaildNickName.test(nickname)) {
      return res.status(400).json({ message: "아이디는 영어와 숫자, 한글만 사용할 수 있습니다." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "비밀번호는 최소 6자 이상이어야 합니다." });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ message: "비밀번호와 비밀번호 확인이 일치하지 않습니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await accountPrisma.$transaction(async (tx) => {
      await tx.account.create({
        data: {
          id,
          password: hashedPassword,
          nickname,
        },
      });

      const createdNow = await tx.account.findFirst({
        where: {
          id,
        },
      });

      await tx.rank.create({
        data: {
          account_id: createdNow.account_id,
        },
      });
    });

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    next(err);
  }
});

/* 로그인 API */
router.post("/accounts/sign-in", async (req, res, next) => {
  try {
    const { id, password } = req.body;

    const isExistAccount = await accountPrisma.account.findFirst({
      where: {
        id,
      },
    });

    if (!isExistAccount) return res.status(401).json({ message: "존재하지 않는 아이디입니다." });
    else if (!(await bcrypt.compare(password, isExistAccount.password)))
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

    const accessToken = jwt.sign(
      { account_id: isExistAccount.account_id },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: "1h" },
    );

    res.cookie("authorization", `Bearer ${accessToken}`);
    return res.status(200).json({ message: "로그인 성공" });
  } catch (error) {
    next(error);
  }
});

/* 캐시 구매 API */
router.patch("/accounts/:id/buy-cash", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accountId } = req.account;

    const isExistAccount = await accountPrisma.account.findFirst({
      where: {
        id: id,
        account_id: accountId,
      },
    });

    if (!isExistAccount) {
      return res.status(404).json({ message: "존재하지 않는 아이디입니다." });
    }

    await accountPrisma.account.update({
      where: {
        account_id: isExistAccount.account_id,
      },
      data: {
        cash: isExistAccount.cash + 20000,
      },
    });

    const responseCash = await accountPrisma.account.findFirst({
      where: {
        account_id: isExistAccount.account_id,
      },
      select: {
        id: true,
        nickname: true,
        cash: true,
      },
    });

    res.status(200).json(responseCash);
  } catch (error) {
    next(error);
  }
});

export default router;
