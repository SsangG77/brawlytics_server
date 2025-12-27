const express = require('express');
const router = express.Router();
const { fetchBrawlStarsData } = require('../services/brawlStarsAPI');
const { validatePlayerTag } = require('../middleware/validatePlayerTag');
const fs = require('fs');
const path = require('path');
const db = require('../db');

const dataPath = path.join(__dirname, '../data/brawlers.json');

router.get('/', validatePlayerTag, async(req, res) => {
    const { playertag } = res.locals;
    try {
        // 플레이어 브롤러 데이터 가져오기
        const playerData = await fetchBrawlStarsData(playertag);
        const playerBrawlers = playerData.brawlers;

        // JSON 브롤러 데이터 로드
        let adminBrawlers = [];
        if (fs.existsSync(dataPath)) {
            const jsonData = fs.readFileSync(dataPath, 'utf-8');
            const brawlersData = JSON.parse(jsonData);
            adminBrawlers = brawlersData.brawlers || [];
        }

        // 하이퍼차지 소유 정보 조회
        let userHypercharges = [];
        try {
            const userResult = await db.query(
                'SELECT id FROM users WHERE tag = $1',
                [playertag]
            );

            if (userResult.rows.length > 0) {
                const userId = userResult.rows[0].id;
                const hyperchargeResult = await db.query(
                    'SELECT hypercharge_name FROM user_hypercharges WHERE user_id = $1 AND owned = true',
                    [userId]
                );
                userHypercharges = hyperchargeResult.rows.map(row => row.hypercharge_name);
            }
        } catch (dbError) {
            console.error('Error fetching hypercharges from DB:', dbError);
            // DB 에러가 나도 계속 진행 (하이퍼차지만 false로 표시)
        }

        // JSON 브롤러 배열을 기준으로 비교
        const comparedBrawlers = adminBrawlers.map(adminBrawler => {
            // 플레이어가 해당 브롤러를 가지고 있는지 확인 (ID 또는 이름으로 매칭)
            const playerBrawler = playerBrawlers.find(
                pb => pb.id === adminBrawler.id || pb.name === adminBrawler.name
            );

            // 기어 이름 매핑 (소문자 -> 대문자)
            const gearNameMap = {
                'speed': 'SPEED',
                'health': 'HEALTH',
                'damage': 'DAMAGE',
                'vision': 'VISION',
                'shield': 'SHIELD',
                'gadgetCooldown': 'GADGET COOLDOWN'
            };

            // 기본 응답 구조
            const result = {
                id: adminBrawler.id,
                name: adminBrawler.name,
                owned: !!playerBrawler,
                rarity: adminBrawler.rarity,
                role: adminBrawler.role
            };

            // 브롤러를 소유하고 있으면 상세 정보 추가
            if (playerBrawler) {
                result.power = playerBrawler.power;
                result.rank = playerBrawler.rank;
                result.trophies = playerBrawler.trophies;
                result.highestTrophies = playerBrawler.highestTrophies;

                // 첫번째 가젯
                result.firstGadget = {
                    name: adminBrawler.firstGadget?.name || '',
                    image: adminBrawler.firstGadget?.image || null,
                    owned: adminBrawler.firstGadget?.name
                        ? playerBrawler.gadgets?.some(g => g.name === adminBrawler.firstGadget.name) || false
                        : false
                };

                // 두번째 가젯
                result.secondGadget = {
                    name: adminBrawler.secondGadget?.name || '',
                    image: adminBrawler.secondGadget?.image || null,
                    owned: adminBrawler.secondGadget?.name
                        ? playerBrawler.gadgets?.some(g => g.name === adminBrawler.secondGadget.name) || false
                        : false
                };

                // 첫번째 스타파워
                result.firstStarPower = {
                    name: adminBrawler.firstStarPower?.name || '',
                    image: adminBrawler.firstStarPower?.image || null,
                    owned: adminBrawler.firstStarPower?.name
                        ? playerBrawler.starPowers?.some(sp => sp.name === adminBrawler.firstStarPower.name) || false
                        : false
                };

                // 두번째 스타파워
                result.secondStarPower = {
                    name: adminBrawler.secondStarPower?.name || '',
                    image: adminBrawler.secondStarPower?.image || null,
                    owned: adminBrawler.secondStarPower?.name
                        ? playerBrawler.starPowers?.some(sp => sp.name === adminBrawler.secondStarPower.name) || false
                        : false
                };

                // 하이퍼차지
                result.hypercharge = {
                    name: adminBrawler.hypercharge?.name || '',
                    image: adminBrawler.hypercharge?.image || null,
                    owned: adminBrawler.hypercharge?.name
                        ? userHypercharges.includes(adminBrawler.hypercharge.name)
                        : false
                };

                // 가젯 버피
                result.gadgetBuff = {
                    name: adminBrawler.gadgetBuff?.name || '',
                    image: adminBrawler.gadgetBuff?.image || null,
                    owned: false
                };

                // 스타파워 버피
                result.starPowerBuff = {
                    name: adminBrawler.starPowerBuff?.name || '',
                    image: adminBrawler.starPowerBuff?.image || null,
                    owned: false
                };

                // 하이퍼차지 버피
                result.hyperchargeBuff = {
                    name: adminBrawler.hyperchargeBuff?.name || '',
                    image: adminBrawler.hyperchargeBuff?.image || null,
                    owned: false
                };

                // 기어 배열
                result.gears = [];
                if (adminBrawler.rareGears && adminBrawler.rareGears.length > 0) {
                    result.gears = adminBrawler.rareGears.map(gearType => {
                        const gearName = gearNameMap[gearType];
                        return {
                            name: gearType,
                            owned: playerBrawler.gears?.some(g => g.name === gearName) || false
                        };
                    });
                }
            } else {
                // 브롤러를 소유하지 않은 경우 모든 아이템도 미소유
                // 첫번째 가젯
                result.firstGadget = {
                    name: adminBrawler.firstGadget?.name || '',
                    image: adminBrawler.firstGadget?.image || null,
                    owned: false
                };

                // 두번째 가젯
                result.secondGadget = {
                    name: adminBrawler.secondGadget?.name || '',
                    image: adminBrawler.secondGadget?.image || null,
                    owned: false
                };

                // 첫번째 스타파워
                result.firstStarPower = {
                    name: adminBrawler.firstStarPower?.name || '',
                    image: adminBrawler.firstStarPower?.image || null,
                    owned: false
                };

                // 두번째 스타파워
                result.secondStarPower = {
                    name: adminBrawler.secondStarPower?.name || '',
                    image: adminBrawler.secondStarPower?.image || null,
                    owned: false
                };

                // 하이퍼차지
                result.hypercharge = {
                    name: adminBrawler.hypercharge?.name || '',
                    image: adminBrawler.hypercharge?.image || null,
                    owned: adminBrawler.hypercharge?.name
                        ? userHypercharges.includes(adminBrawler.hypercharge.name)
                        : false
                };

                // 가젯 버피
                result.gadgetBuff = {
                    name: adminBrawler.gadgetBuff?.name || '',
                    image: adminBrawler.gadgetBuff?.image || null,
                    owned: false
                };

                // 스타파워 버피
                result.starPowerBuff = {
                    name: adminBrawler.starPowerBuff?.name || '',
                    image: adminBrawler.starPowerBuff?.image || null,
                    owned: false
                };

                // 하이퍼차지 버피
                result.hyperchargeBuff = {
                    name: adminBrawler.hyperchargeBuff?.name || '',
                    image: adminBrawler.hyperchargeBuff?.image || null,
                    owned: false
                };

                // 기어 배열
                result.gears = [];
                if (adminBrawler.rareGears) {
                    result.gears = adminBrawler.rareGears.map(gearType => ({
                        name: gearType,
                        owned: false
                    }));
                }
            }

            return result;
        });

        res.status(200).json(comparedBrawlers);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || 'An error occurred while fetching player data' });
    }
});

router.get('/trophy', validatePlayerTag, async(req, res) => {
    const { playertag } = res.locals;
    try {
        const data = await fetchBrawlStarsData(playertag);
        const brawlersTrophy = data.brawlers.map(brawler => ({
            id: brawler.id.toString(),
            name: brawler.name,
            rank: brawler.rank,
            currentTrophy: brawler.trophies,
            highestTrophy: brawler.highestTrophies
        }));
        res.status(200).json(brawlersTrophy);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || 'An error occurred while fetching player data' });
    }
})

module.exports = router;

