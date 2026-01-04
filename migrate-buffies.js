const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data/brawlers.json');

// 이름을 안전한 파일명으로 변환
function toImageName(name) {
    if (!name || name === '') return null;
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

// 마이그레이션 실행
function migrateBrawlers() {
    console.log('🔄 Starting buffie migration...');

    if (!fs.existsSync(dataPath)) {
        console.error('❌ brawlers.json not found!');
        return;
    }

    // JSON 파일 읽기
    const data = fs.readFileSync(dataPath, 'utf-8');
    const brawlersData = JSON.parse(data);

    let updatedCount = 0;

    // 각 브롤러 업데이트
    brawlersData.brawlers = brawlersData.brawlers.map(brawler => {
        // 버피가 이미 있는지 확인
        const hasBuffies = brawler.gadgetBuff?.name || brawler.starPowerBuff?.name || brawler.hyperchargeBuff?.name;

        if (!hasBuffies) {
            console.log(`  ✅ Adding buffies to: ${brawler.name}`);
            updatedCount++;

            return {
                ...brawler,
                gadgetBuff: createItemObject(`${brawler.name}'S GADGET BUFFIE`),
                starPowerBuff: createItemObject(`${brawler.name}'S STAR BUFFIE`),
                hyperchargeBuff: createItemObject(`${brawler.name}'S HYPER BUFFIE`)
            };
        }

        return brawler;
    });

    // JSON 파일 저장
    fs.writeFileSync(dataPath, JSON.stringify(brawlersData, null, 2), 'utf-8');

    console.log(`\n✨ Migration complete! Updated ${updatedCount} brawlers.`);
}

// 실행
migrateBrawlers();
