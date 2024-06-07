# 삼위일체 - Football online project

## ✨ AWS 배포 링크

- [풋살 온라인](http://talpangee.shop:3000)

## 👋 소개

- **삼위일체**는 리그 오브 레전드의 아이템 "트리포스"에서 영감을 받은 것으로, 3팀 구성원 간의 조화와 시너지를 강조하는 의미를 가진 팀 이름입니다.
- 우리 팀은 피파 온라인 4를 오마주한 **풋살 온라인 게임**을 제작합니다.

## 👩‍💻 팀원

<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://github.com/tmdwnsasa"><img src="https://avatars.githubusercontent.com/u/16133454?v=4" width="100px;" alt=""/><br /><sub><b> 팀장 : 정윤제 </b></sub></a><br /></td>
      <td align="center"><a href="https://github.com/Kdkplaton"><img src="https://avatars.githubusercontent.com/u/160683826?v=4" width="100px;" alt=""/><br /><sub><b> 팀원 : 김동규 </b></sub></a><br /></td>
      <td align="center"><a href="https://github.com/wantfree8937"><img src="https://avatars.githubusercontent.com/u/101966192?v=4" width="100px;" alt=""/><br /><sub><b> 팀원 : 박승엽 </b></sub></a><br /></td>
      <td align="center"><a href="https://github.com/TalpangEE"><img src="https://avatars.githubusercontent.com/u/106961017?v=4" width="100px;" alt=""/><br /><sub><b> 팀원 : 박진수 </b></sub></a><br /></td>
      <td align="center"><a href="https://github.com/KR-EGOIST"><img src="https://avatars.githubusercontent.com/u/54177070?v=4" width="100px;" alt=""/><br /><sub><b> 팀원 : 윤진호 </b></sub></a><br /></td>
      <td align="center"><a href="https://github.com/mimihimesama"><img src="https://avatars.githubusercontent.com/u/106059492?v=4" width="100px;" alt=""/><br /><sub><b> 팀원 : 황정민 </b></sub></a><br /></td>
    </tr>
  </tbody>
</table>

## ⚙️ Backend 기술 스택

<img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white">
<img src="https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white">
<img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
<img src="https://img.shields.io/badge/prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white">

## 📄 프로젝트 도큐먼트

### [API명세서](https://opaque-onion-d3e.notion.site/API-1ec2e3bcb86440739b6782d95018c9f8)

### ERD Diagram

![Untitled](https://github.com/tmdwnsasa/Football_online_project/assets/101966192/a1f45b90-db12-4598-b871-a05ec7db1540)  

## ⚽ 프로젝트 주요 기능

1. **회원가입 / 로그인**: 사용자들은 회원가입과 로그인을 통하여 주요 기능들을 이용할 수 있습니다. 회원가입 시 기본 캐시가 충전됩니다.

2. **선수 뽑기**: 일정량의 캐시를 소비하여 선수를 랜덤으로 뽑을 수 있습니다.

3. **나만의 팀 꾸리기**: 나의 선수 인벤토리에서 원하는 선수를 차출하여 팀에 배정할 수 있습니다.

4. **자동 매칭 축구 게임**: 해당 API 호출 시 매칭될 상대팀을 자동으로 찾고 각각의 팀 스탯을 토대로 경기 결과를 반환합니다.

5. **유저 랭킹 조회**: 사용자들의 게임 점수와 승률, 승/무/패 횟수를 확인할 수 있습니다. 로그인이 필요하지 않습니다.

## 🚀 추가 구현 기능

#### **💪 선수 강화 기능**

- 같은 레벨의 같은 선수 2개와 레벨에 따른 금액을 지불하여 선택한 선수를 강화할 수 있습니다.
- 강화하면 한 단계 오른 레벨의 스탯이 출력되고 보유금 잔액도 출력됩니다.

#### **💰 이적시장 기능**

- 만약 유저가 선수를 팔고 싶다면 인벤토리에 있는 선수의 ID와 레벨, 판매 가격을 입력하여 시장에 등록할 수 있습니다.
- 시장에 등록된 선수를 갖고 싶은 유저는 판매 가격만큼의 돈을 내고 구매할 수 있습니다.
- 전체 시장 목록을 가져올 수 있고, 원하는 선수가 있는지 선수의 이름으로 검색할 수도 있습니다.
