import express from "express";
import cookieParser from "cookie-parser";
import dotEnv from "dotenv";
import accountRouter from "./routes/accounts.router.js";
import playerData from "./routes/inventory.router.js";
import makedata from "./srcipt/makedata.js";

dotEnv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use("/api", [accountRouter,playerData]);

makedata();


app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸다.");
});