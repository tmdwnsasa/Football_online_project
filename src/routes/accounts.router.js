import express from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { accountPrisma } from "../utils/prisma/index.js";
import authMiddleware from '../middlewares/auth.middleware.js';


const router = express.Router();

// 회원가입 API
router.post('/accounts/sign-up', async (req, res, next) => {
  try {
    const { id, password, passwordConfirm, nickname } = req.body;

    const isExistAccount = await accountPrisma.account.findFirst({
      where: {
        id,
      },
    });
    
    if (isExistAccount) {
      return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
    }

    const vaildIdname = /^[a-z0-9]+$/;
    if (!vaildIdname.test(id)) {
      return res
        .status(400)
        .json({ message: '아이디는 영어와 숫자만 사용할 수 있습니다.' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: '비밀번호는 최소 6자 이상이어야 합니다.' });
    }

    if (password !== passwordConfirm) {
      return res
        .status(400)
        .json({ message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await accountPrisma.account.create({
      data: {
        id,
        password: hashedPassword,
        nickname,
      },
    });

    return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// 로그인 API
router.post('/accounts/sign-in', async (req, res, next) => {
  try {
    const { id, password } = req.body;

    const isExistAccount = await accountPrisma.account.findFirst({
      where: {
        id,
      },
    });

    if (!isExistAccount)
      return res.status(401).json({ message: '존재하지 않는 아이디입니다.' });
    else if (!(await bcrypt.compare(password, isExistAccount.password)))
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

    const accessToken = jwt.sign(
      { account_id: isExistAccount.account_id },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.cookie('authorization', `Bearer ${accessToken}`);
    return res.status(200).json({ message: '로그인 성공' });
  } catch (error) {
    next(error);
  }
});


export default router;
