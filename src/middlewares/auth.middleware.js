import jwt from "jsonwebtoken";
import { accountPrisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
  try {
    const { authorization } = req.cookies;

    const [tokenType, token] = authorization.split(" ");
    if (tokenType !== "Bearer") return res.status(401).json({ message: "베어러 토큰이 아닙니다." });

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
    const account_id = decodedToken.account_id;
    const account = await accountPrisma.account.findFirst({
      where: { account_id },
    });

    req.user = account;
    
    next();
  } catch (error) {
    switch (error.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다." });
      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰이 조작되었습니다." });
      default:
        return res.status(401).json({ message: error.message ?? "비정상적인 요청입니다." });
    }
  }
}
