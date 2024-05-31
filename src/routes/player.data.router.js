import express from "express";
import { playerPrisma } from "../utils/prisma/index.js";
import playerData from "../../resources/player.data.json" assert {type: "json"};

const router = express.Router();

// router.post("/data", async (req, res) => {

//   for (const data of playerData["data"]) {
//     await playerPrisma.player.create({
//       data: {
//         name: data["name"],
//         speed: data["speed"],
//         goal_decision: data["goal_decision"],
//         shoot_power: data["shoot_power"],
//         defense: data["defense"],
//         stamina: data["stamina"],
//       },

//     });
//   }
//   return res.status(200).json((playerData["data"]))
// });

router.get("/gatcha", async (req, res)=>{
  try{
		const playerGatch = await playerPrisma.player.findFirst({
			where:{player_id}
		})
		return res.status(201).json({playerGatch, message : "가챠!"})
	}
  catch(err){
    next(err)
  }
})
export default router;