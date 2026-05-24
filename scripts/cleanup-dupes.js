// 일회성 정리 스크립트.
// 동기화 도입 전, 관리자 폼이 랜덤 id로 만들어 둔 브롤러 + 동기화가 API id로 새로 추가한
// 브롤러가 같은 이름으로 중복된 경우를 정리한다.
//
// 같은 이름이 2개일 때:
//   - 관리자가 채워둔 항목(데이터 보존)의 id 를 API 기준 id 로 교정
//   - 동기화가 만든 빈 스텁(API id 항목)을 제거
//   - 정리된 항목은 needsReview 로 표시해 관리자가 최종 확인하도록 함
//   - 이미지 파일/폴더는 건드리지 않음 (json 만 수정)
//
// 기본은 DRY-RUN(미적용). 실제 반영하려면 --apply 플래그.
//   node scripts/cleanup-dupes.js          # 미리보기
//   node scripts/cleanup-dupes.js --apply  # 실제 적용

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/brawlers.json');
const apply = process.argv.includes('--apply');

// [이름, Brawl Stars API 실제 id] — 2026-05 동기화로 추가된 신규 브롤러들
const targets = [
    ['SIRIUS', 16000102],
    ['NAJIA', 16000103],
    ['DAMIAN', 16000104],
    ['STARR NOVA', 16000105],
    ['BOLT', 16000106],
];

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
let changed = 0;

for (const [name, apiId] of targets) {
    const entries = data.brawlers.filter(b => b.name === name);

    if (entries.length < 2) {
        console.log(`[건너뜀] ${name}: 중복 아님 (항목 ${entries.length}개)`);
        continue;
    }
    if (entries.length > 2) {
        console.log(`[주의] ${name}: 항목이 ${entries.length}개 — 수동 확인 필요. 건너뜀`);
        continue;
    }

    const stub = entries.find(b => b.id === apiId);       // 동기화 스텁 (빈 항목)
    const adminEntry = entries.find(b => b.id !== apiId); // 관리자가 채운 항목

    if (!stub || !adminEntry) {
        console.log(`[주의] ${name}: API id(${apiId}) 스텁 또는 관리자 항목을 못 찾음. 건너뜀`);
        continue;
    }

    console.log(`[정리] ${name}: 관리자 항목 id ${adminEntry.id} → ${apiId} 로 교정, 스텁(id ${apiId}, rarity="${stub.rarity}") 제거`);

    adminEntry.id = apiId;
    adminEntry.needsReview = true;
    adminEntry.reviewInfo = {
        type: 'new',
        changes: ['중복 정리 + id를 Brawl Stars API 기준으로 교정됨 — 확인 필요'],
        detectedAt: new Date().toISOString()
    };
    data.brawlers = data.brawlers.filter(b => b !== stub);
    changed++;
}

console.log(`\n처리: ${changed}건 / 총 브롤러: ${data.brawlers.length}개`);

if (!apply) {
    console.log('\n[DRY-RUN] 반영하지 않았습니다. 적용하려면: node scripts/cleanup-dupes.js --apply');
} else {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('\n[적용됨] data/brawlers.json 저장 완료.');
}
