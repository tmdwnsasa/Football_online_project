import express from "express";
import accountRouter from "./routes/accounts.router.js";
import playRouter from "./routes/play.router.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/api", [accountRouter, playRouter]);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸다.");
});
