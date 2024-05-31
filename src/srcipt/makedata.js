import { playerPrisma } from "../utils/prisma/index.js";
import playerData from "../../resources/player.data.json" assert {type: "json"};

export default async function () {
    const playerdatas = await playerPrisma.player.findMany({
    select : {player_id :true,},
    orderBy :{
        player_id : "asc" 
    },

    })
console.log(playerdatas)

    for (const data of playerData["data"]) {
        await playerPrisma.player.create({
            data: {
                level: data["level"],
                name: data["name"],
                speed: data["speed"],
                goal_decision: data["goal_decision"],
                shoot_power: data["shoot_power"],
                defense: data["defense"],
                stamina: data["stamina"],
            },
        });
    }
//db와 json에 있는 데이터가 같은지 알아보고 같지 않다면 추가

}


