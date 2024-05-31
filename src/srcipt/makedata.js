import { playerPrisma } from "../utils/prisma/index.js";
import playerData from "../../resources/player.data.json" assert {type: "json"};


//db와 json에 있는 데이터가 같은지 알아보고 같지 않다면 추가
export default async function () {
  const playerdatas = await playerPrisma.player.findMany({
    select: { player_id: true, },
    orderBy: {
      player_id: "asc"
    },

  })
  //player datas 마지막 원소의 player_id를 출력
  if (playerdatas.length === 0) {
    for (const data of playerData["data"]) {
      await playerPrisma.player.create({
        data:
        {
          player_id: data["player_id"],
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
  }
  if (playerdatas.length > 0) {
    //현재 데이터베이스에 저장되어있는 playerdats 안에 player_id값보다 큰 것만 json에서 받아서 creat한다
    for (const data of playerData["data"]) {
      if (playerdatas[playerdatas.length - 1] < data["player_id"])
        await playerPrisma.player.create({
          data:
          {
            player_id: data["player_id"],
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
  }
}