import express from "express";

const router = express.Router();

router.get("/users", async (req, res) => {
  return res.status(200).json({ message: "user Get" });
});

export default router;
