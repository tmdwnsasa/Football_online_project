import express from "express";
import accountRouter from "./routes/accounts.router.js";
import playerData from "./routes/player.data.router.js";
import makedata from "./srcipt/makedata.js";
const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/api", [accountRouter,playerData]);

makedata();

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸다.");
});
