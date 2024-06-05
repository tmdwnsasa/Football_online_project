import express from "express";
import cookieParser from "cookie-parser";
import LogMiddleware from "./middlewares/log.middleware.js";
import accountRouter from "./routes/accounts.router.js";
import playerData from "./routes/inventory.router.js";
import teamRouter from "./routes/team.router.js";
import playRouter from "./routes/play.router.js";
import rankRouter from "./routes/rank.router.js";
import auctionRouter from "./routes/auction.router.js";
import ErrorHandlingMiddleware from "./middlewares/error-handling.middleware.js";
import dotenv from "dotenv";
import makedata from "./srcipt/makedata.js";

dotenv.config();
makedata();

const app = express();
const PORT = 3000;

app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use("/api", [accountRouter, playerData, teamRouter, playRouter, rankRouter, auctionRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸다.");
});
