
const fs = require('fs');
const path = require('path');
const { fetchAllBrawlers } = require('./brawlStarsAPI');

const dataPath = path.join(__dirname, '../data/brawlers.json');

// 이름만 있는 아이템 (이미지는 관리자가 추후 업로드)
function nameOnlyItem(name) {
    return { name: name || '', image: null };
}

// API 브롤러 → brawlers.json 신규 브롤러 객체
// API가 주는 것(이름/가젯/스타파워/하이퍼차지 이름)은 채우고,
// 안 주는 것(이미지/버피/희귀도/역할군)은 빈 값으로 두고 관리자가 채움
function buildNewBrawler(apiBrawler, nowISO) {
    const gadgets = apiBrawler.gadgets || [];
    const starPowers = apiBrawler.starPowers || [];
    const hyperCharges = apiBrawler.hyperCharges || [];

    return {
        id: apiBrawler.id,
        name: apiBrawler.name,
        firstGadget: nameOnlyItem(gadgets[0] && gadgets[0].name),
        secondGadget: nameOnlyItem(gadgets[1] && gadgets[1].name),
        firstStarPower: nameOnlyItem(starPowers[0] && starPowers[0].name),
        secondStarPower: nameOnlyItem(starPowers[1] && starPowers[1].name),
        hypercharge: nameOnlyItem(hyperCharges[0] && hyperCharges[0].name),
        gadgetBuff: { name: '', image: null },
        starPowerBuff: { name: '', image: null },
        hyperchargeBuff: { name: '', image: null },
        rareGears: ['speed', 'health', 'damage', 'vision', 'shield', 'gadgetCooldown'],
        rarity: '',
        role: '',
        createdAt: nowISO,
        updatedAt: nowISO,
        needsReview: true,
        reviewInfo: {
            type: 'new',
            changes: ['신규 브롤러 추가'],
            detectedAt: nowISO
        }
    };
}

// 기존 브롤러를 API와 대조.
// - 비어 있는 하이퍼차지는 API 이름으로 채움(이미지는 관리자가 업로드)
// - 이름/가젯/스타파워/하이퍼차지 변경은 플래그만 함 (폴더 리네임 등은 관리자가 폼에서 처리)
// jsonBrawler를 직접 수정하고 변경 목록을 반환한다.
function reconcileExisting(apiBrawler, jsonBrawler) {
    const changes = [];

    if (apiBrawler.name && apiBrawler.name !== jsonBrawler.name) {
        changes.push(`이름 변경: ${jsonBrawler.name} → ${apiBrawler.name}`);
    }

    const jsonGadgetNames = [
        jsonBrawler.firstGadget && jsonBrawler.firstGadget.name,
        jsonBrawler.secondGadget && jsonBrawler.secondGadget.name
    ].filter(Boolean);
    for (const gadget of (apiBrawler.gadgets || [])) {
        if (gadget.name && !jsonGadgetNames.includes(gadget.name)) {
            changes.push(`새 가젯: ${gadget.name}`);
        }
    }

    const jsonStarPowerNames = [
        jsonBrawler.firstStarPower && jsonBrawler.firstStarPower.name,
        jsonBrawler.secondStarPower && jsonBrawler.secondStarPower.name
    ].filter(Boolean);
    for (const starPower of (apiBrawler.starPowers || [])) {
        if (starPower.name && !jsonStarPowerNames.includes(starPower.name)) {
            changes.push(`새 스타파워: ${starPower.name}`);
        }
    }

    // 하이퍼차지: 비어 있으면 API 이름으로 채움, 이름이 다르면 변경만 표시(덮어쓰지 않음)
    const apiHyper = (apiBrawler.hyperCharges || [])[0];
    if (apiHyper && apiHyper.name) {
        const currentHyper = jsonBrawler.hypercharge && jsonBrawler.hypercharge.name;
        if (!currentHyper) {
            jsonBrawler.hypercharge = { name: apiHyper.name, image: null };
            changes.push(`하이퍼차지 추가: ${apiHyper.name}`);
        } else if (currentHyper !== apiHyper.name) {
            changes.push(`하이퍼차지 변경: ${currentHyper} → ${apiHyper.name}`);
        }
    }

    return changes;
}

// Brawl Stars API와 brawlers.json 동기화
// - API에 있고 json에 없는 브롤러(id 기준) → json에 추가 (needsReview)
// - 이미 있는 브롤러 중 이름/가젯/스타파워가 바뀌거나 추가됨 → needsReview 플래그만 설정 (필드는 관리자가 직접 반영)
// 반환: { added: [...], changed: [...] }
async function syncBrawlersJson() {
    const nowISO = new Date().toISOString();

    // 1) API 데이터
    const apiData = await fetchAllBrawlers();
    const apiBrawlers = (apiData && apiData.items) || [];
    if (apiBrawlers.length === 0) {
        throw new Error('API에서 브롤러 목록을 가져오지 못했습니다.');
    }

    // 2) 로컬 brawlers.json
    let brawlersData = { brawlers: [] };
    if (fs.existsSync(dataPath)) {
        brawlersData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    if (!Array.isArray(brawlersData.brawlers)) {
        brawlersData.brawlers = [];
    }

    const added = [];
    const changed = [];

    for (const apiBrawler of apiBrawlers) {
        if (apiBrawler.id == null) continue;

        const existing = brawlersData.brawlers.find(b => b.id === apiBrawler.id);

        if (!existing) {
            const newBrawler = buildNewBrawler(apiBrawler, nowISO);
            brawlersData.brawlers.push(newBrawler);
            added.push({ id: newBrawler.id, name: newBrawler.name });
        } else {
            const changes = reconcileExisting(apiBrawler, existing);
            if (changes.length > 0) {
                existing.needsReview = true;
                existing.reviewInfo = {
                    type: 'changed',
                    changes,
                    detectedAt: nowISO
                };
                changed.push({ id: existing.id, name: existing.name, changes });
            }
        }
    }

    // 3) 변경이 있을 때만 저장
    if (added.length > 0 || changed.length > 0) {
        fs.writeFileSync(dataPath, JSON.stringify(brawlersData, null, 2), 'utf-8');
    }

    return { added, changed };
}

module.exports = { syncBrawlersJson };
