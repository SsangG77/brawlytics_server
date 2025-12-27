const express = require('express');
const router = express.Router();
const { initializeBrawlersTable } = require('../services/brawlerService');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/brawlers.json');

// 이름을 안전한 파일명으로 변환
function toImageName(name) {
    if (!name || name === '') return null;
    // 파일명에 위험한 문자만 제거: < > : " / \ | ? *
    const safeName = name.replace(/[<>:"/\\|?*]/g, '');
    return `${safeName}.png`;
}

// 아이템 객체 생성
function createItemObject(name) {
    if (!name || name === '') {
        return { name: '', image: null };
    }
    return {
        name: name,
        image: toImageName(name)
    };
}

router.get('/save', async (req, res) => {
    console.log('Manually triggering brawlers table initialization...');
    try {
        await initializeBrawlersTable();
        res.status(200).json({ message: 'Brawlers table initialization triggered successfully.' });
    } catch (error) {
        console.error('Error manually triggering brawlers table initialization:', error);
        res.status(500).json({ error: 'Failed to trigger brawlers table initialization.' });
    }
});

// 브롤러 목록 조회
router.get('/brawlers', (req, res) => {
    try {
        if (!fs.existsSync(dataPath)) {
            // 파일이 없으면 빈 배열 반환
            return res.status(200).json({ brawlers: [] });
        }

        const data = fs.readFileSync(dataPath, 'utf-8');
        const brawlers = JSON.parse(data);
        res.status(200).json(brawlers);
    } catch (error) {
        console.error('Error reading brawlers:', error);
        res.status(500).json({ error: error.message });
    }
});

// 브롤러 등록
router.post('/brawlers', upload.fields([
    { name: 'brawler_image', maxCount: 1 },
    { name: 'first_gadget_image', maxCount: 1 },
    { name: 'second_gadget_image', maxCount: 1 },
    { name: 'first_star_power_image', maxCount: 1 },
    { name: 'second_star_power_image', maxCount: 1 },
    { name: 'hypercharge_image', maxCount: 1 },
    { name: 'gadget_buff_image', maxCount: 1 },
    { name: 'star_power_buff_image', maxCount: 1 },
    { name: 'hypercharge_buff_image', maxCount: 1 }
]), (req, res) => {
    try {
        const {
            name,
            first_gadget_name, second_gadget_name,
            first_star_power_name, second_star_power_name,
            hypercharge_name,
            gadget_buff_name, star_power_buff_name, hypercharge_buff_name,
            rarity, role
        } = req.body;

        const files = req.files;

        // 기어 배열 처리
        let rare_gears = [];
        if (req.body.rare_gears) {
            rare_gears = Array.isArray(req.body.rare_gears)
                ? req.body.rare_gears
                : [req.body.rare_gears];
        }

        // JSON 파일 읽기 또는 생성
        let brawlersData = { brawlers: [] };
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf-8');
            brawlersData = JSON.parse(data);
        }

        // 랜덤 ID 생성 (16000000 ~ 16999999 범위에서 중복되지 않는 ID)
        let newId;
        do {
            newId = 16000000 + Math.floor(Math.random() * 1000000);
        } while (brawlersData.brawlers.some(b => b.id === newId));

        // 새 브롤러 객체 생성
        const newBrawler = {
            id: newId,
            name,
            firstGadget: createItemObject(first_gadget_name),
            secondGadget: createItemObject(second_gadget_name),
            firstStarPower: createItemObject(first_star_power_name),
            secondStarPower: createItemObject(second_star_power_name),
            hypercharge: createItemObject(hypercharge_name),
            gadgetBuff: createItemObject(gadget_buff_name),
            starPowerBuff: createItemObject(star_power_buff_name),
            hyperchargeBuff: createItemObject(hypercharge_buff_name),
            rareGears: rare_gears,
            rarity: rarity,
            role: role,
            createdAt: new Date().toISOString()
        };

        // 브롤러 추가
        brawlersData.brawlers.push(newBrawler);

        // JSON 파일 저장
        fs.writeFileSync(dataPath, JSON.stringify(brawlersData, null, 2), 'utf-8');

        res.status(200).json({ success: true, brawler: newBrawler });
    } catch (error) {
        console.error('Error saving brawler:', error);
        res.status(500).json({ error: error.message });
    }
});

// 브롤러 수정
router.put('/brawlers/:id', upload.fields([
    { name: 'brawler_image', maxCount: 1 },
    { name: 'first_gadget_image', maxCount: 1 },
    { name: 'second_gadget_image', maxCount: 1 },
    { name: 'first_star_power_image', maxCount: 1 },
    { name: 'second_star_power_image', maxCount: 1 },
    { name: 'hypercharge_image', maxCount: 1 },
    { name: 'gadget_buff_image', maxCount: 1 },
    { name: 'star_power_buff_image', maxCount: 1 },
    { name: 'hypercharge_buff_image', maxCount: 1 }
]), (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const {
            name,
            first_gadget_name, second_gadget_name,
            first_star_power_name, second_star_power_name,
            hypercharge_name,
            gadget_buff_name, star_power_buff_name, hypercharge_buff_name,
            rarity, role
        } = req.body;

        const files = req.files;

        // 기어 배열 처리
        let rare_gears = [];
        if (req.body.rare_gears) {
            rare_gears = Array.isArray(req.body.rare_gears)
                ? req.body.rare_gears
                : [req.body.rare_gears];
        }

        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ error: 'No brawlers found' });
        }

        const data = fs.readFileSync(dataPath, 'utf-8');
        const brawlersData = JSON.parse(data);

        const index = brawlersData.brawlers.findIndex(b => b.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Brawler not found' });
        }

        // 기존 브롤러 데이터 가져오기
        const existingBrawler = brawlersData.brawlers[index];

        // 업데이트된 브롤러 객체 생성
        const updatedBrawler = {
            id: id,
            name,
            firstGadget: createItemObject(first_gadget_name),
            secondGadget: createItemObject(second_gadget_name),
            firstStarPower: createItemObject(first_star_power_name),
            secondStarPower: createItemObject(second_star_power_name),
            hypercharge: createItemObject(hypercharge_name),
            gadgetBuff: createItemObject(gadget_buff_name),
            starPowerBuff: createItemObject(star_power_buff_name),
            hyperchargeBuff: createItemObject(hypercharge_buff_name),
            rareGears: rare_gears,
            rarity: rarity,
            role: role,
            createdAt: existingBrawler.createdAt || existingBrawler.created_at,
            updatedAt: new Date().toISOString()
        };

        // 업데이트
        brawlersData.brawlers[index] = updatedBrawler;

        // 저장
        fs.writeFileSync(dataPath, JSON.stringify(brawlersData, null, 2), 'utf-8');

        res.status(200).json({ success: true, brawler: updatedBrawler });
    } catch (error) {
        console.error('Error updating brawler:', error);
        res.status(500).json({ error: error.message });
    }
});

// 브롤러 삭제
router.delete('/brawlers/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ error: 'No brawlers found' });
        }

        const data = fs.readFileSync(dataPath, 'utf-8');
        const brawlersData = JSON.parse(data);

        const index = brawlersData.brawlers.findIndex(b => b.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Brawler not found' });
        }

        // 브롤러 정보 가져오기
        const brawler = brawlersData.brawlers[index];
        const brawlerName = brawler.name;

        // 이미지 폴더 삭제
        const brawlerDir = path.join(__dirname, '../uploads/brawlers', brawlerName);
        if (fs.existsSync(brawlerDir)) {
            fs.rmSync(brawlerDir, { recursive: true, force: true });
            console.log(`Deleted brawler folder: ${brawlerDir}`);
        }

        // JSON에서 삭제
        brawlersData.brawlers.splice(index, 1);

        // 저장
        fs.writeFileSync(dataPath, JSON.stringify(brawlersData, null, 2), 'utf-8');

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting brawler:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;