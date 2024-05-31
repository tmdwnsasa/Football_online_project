import express from "express";
import accountRouter from "./routes/accounts.router.js";
import characterData from "./routes/character.data.router.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/api", [accountRouter,characterData]);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸다.");
});
