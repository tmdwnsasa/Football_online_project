import express from "express";
import { characterPrisma } from "../utils/prisma/index.js";
import characterData from "../../resources/character.data.json" assert {type: "json"};

const router = express.Router();

router.post("/data", async (req, res) => {

  for (const data of characterData["data"]) {
    await characterPrisma.character.create({
      data: {
        name: data["name"],
        speed: data["speed"],
        goal_decision: data["goal_decision"],
        shoot_power: data["shoot_power"],
        defense: data["defense"],
        stamina: data["stamina"],
      },

    });
  }
  return res.status(200).json((characterData["data"]))
});

router.get("/gatcha", async (req, res)=>{
  try{
		const gatchaId = Math.floor(Math.random()*30);

		const characterGatch = await characterPrisma.character.findFirst({
			where:{character_id}
		})
		return res.status(201).json({characterGatch, message : "가챠!"})
	}
  catch(err){
    next(err)
  }
})
export default router;