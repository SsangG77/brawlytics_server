# 데이터 백업 구조 세팅 가이드

브롤러 데이터(`data/brawlers.json`)와 업로드 이미지(`uploads/`)를 **서버 원본 + `data-backup` 브랜치 스냅샷**으로 관리하기 위한 1회 세팅 가이드.

## 왜 이렇게 하나
- 데이터와 이미지는 **서버 파일시스템이 원본**임 (관리자 페이지 수정 + 매월 자동 동기화가 직접 씀).
- `git`의 데이터는 push 시점의 낡은 스냅샷일 뿐이라, 배포(`git pull origin main`)가 서버의 실시간 데이터를 덮어쓰면 안 됨.
- 그래서:
  - **main 브랜치**: 코드만 추적. `data/`·`uploads/`는 추적 제외(`.gitignore`).
  - **data-backup 브랜치**: 데이터·이미지 스냅샷을 주기적으로 push (롤백/복원용). `deploy.yml`이 안 보는 브랜치라 배포를 트리거하지 않음.

```
서버 /var/www/brawlytics_server (main 체크아웃)
├─ 코드(.js/.html/.css)      ← deploy 가 git pull 로 갱신
└─ data/, uploads/           ← 추적 제외, 실시간 원본 (동기화·관리자가 직접 씀)
                                   │ 백업 크론이 복사 + commit + push
                                   ▼
서버 /var/www/brawlytics_data_backup (data-backup 체크아웃)
└─ 월별 데이터 스냅샷 (롤백/복원용)
```

---

## 진행 순서 요약
- **Phase 1** — `data-backup` 브랜치 생성 + 백업 클론/크론 세팅 → **데이터를 먼저 안전하게 백업** (이후 무슨 일이 있어도 데이터는 보존됨)
- **Phase 2** — main에서 `data/`·`uploads/` 추적 제외 + 서버 전환 → 배포가 데이터를 안 건드리게

> ⚠️ 반드시 Phase 1(백업)을 먼저 끝낸 뒤 Phase 2를 진행할 것.

---

## Phase 1 — data-backup 브랜치 + 백업 세팅

### 1-1. data-backup 브랜치 생성 (로컬 작업용 PC에서)
현재 데이터/이미지를 초기 스냅샷으로 담은 orphan 브랜치를 만든다. (코드 히스토리 없이 데이터만)

```bash
cd <레포 폴더>

# 현재 main 의 데이터가 들어있는 상태에서 orphan 브랜치 생성
git checkout --orphan data-backup
git reset            # 인덱스 비우기 (파일은 워킹트리에 그대로 남음)

# 이 브랜치 전용 .gitignore (data/uploads 를 추적해야 하므로 제외 규칙 없음)
cat > .gitignore <<'EOF'
node_modules/
.env*
.env.save
.DS_Store
EOF

# 데이터/이미지만 커밋
git add .gitignore data uploads
git commit -m "data-backup: 초기 데이터 스냅샷"
git push -u origin data-backup

# 다시 main 으로 복귀
git checkout main
```

### 1-2. 서버에 백업용 클론 만들기 (Vultr 서버에서)
```bash
sudo git clone https://github.com/SsangG77/brawlytics_server.git /var/www/brawlytics_data_backup
cd /var/www/brawlytics_data_backup
git checkout data-backup
```

### 1-3. 서버가 push 할 수 있게 인증 설정
백업 클론이 `data-backup`으로 push 하려면 쓰기 권한이 필요함. 둘 중 하나.

- **(A) GitHub PAT(토큰) 사용** — 가장 간단
  ```bash
  cd /var/www/brawlytics_data_backup
  git remote set-url origin https://<USERNAME>:<TOKEN>@github.com/SsangG77/brawlytics_server.git
  # TOKEN: GitHub Settings > Developer settings > Personal access tokens (repo 쓰기 권한)
  ```
- **(B) SSH 배포키 사용** — 키 유출 시 피해 범위를 줄이려면 권장. 단, 같은 레포라 키는 main에도 push 가능 → **main 브랜치 보호 규칙(branch protection)** 으로 직접 push 차단 권장.

> rsync 가 없으면: `sudo apt-get update && sudo apt-get install -y rsync`

### 1-4. 첫 백업 실행 (서버에서)
```bash
/var/www/brawlytics_server/scripts/backup-data.sh
```
→ 서버의 **실시간** data/uploads 가 data-backup 브랜치에 올라가면 성공. **이 시점부터 데이터는 안전하게 백업됨.**

### 1-5. 백업 크론 등록 (서버에서)
```bash
crontab -e
```
아래 한 줄 추가 (매일 새벽 4시):
```
0 4 * * * /var/www/brawlytics_server/scripts/backup-data.sh >> /var/log/brawlytics-backup.log 2>&1
```
> 매월 동기화 직후 시점에도 백업이 돌게 하려면 `0 1 1 * *` 줄을 추가로 넣어도 됨.

---

## Phase 2 — main에서 데이터 추적 제외 + 서버 전환

> Phase 1 의 첫 백업(1-4)이 끝났는지 반드시 확인하고 진행할 것.

### 2-1. main에서 추적 제외 커밋 (로컬 작업용 PC에서)
이 레포에는 이미 `.gitignore`에 `data/`·`uploads/` 제외 규칙과 `data/.gitkeep`, `uploads/.gitkeep` 가 준비돼 있음. 인덱스에서만 제거하면 됨.

```bash
cd <레포 폴더>
git checkout main

git rm -r --cached data uploads
git add .gitignore data/.gitkeep uploads/.gitkeep
git commit -m "데이터/이미지를 추적 제외 — 서버를 원본으로, data-backup 으로 백업"
git push origin main
```

> ⚠️ 이 push 는 자동 배포를 트리거함. 그런데 서버 전환(2-2) 전이라 그 배포의 `git pull` 은 **충돌로 실패할 수 있음 — 정상임**(데이터는 Phase 1에서 백업됨, 앱은 기존 상태로 계속 동작). 곧바로 2-2 를 수행하면 됨.

### 2-2. 서버 전환 (Vultr 서버에서)
서버의 실시간 데이터를 보존하면서 추적 제외 커밋을 반영한다.

```bash
cd /var/www/brawlytics_server

# (1) 만일 대비 실시간 데이터 안전 복사
cp -a data    /tmp/brawlytics_data_safety
cp -a uploads /tmp/brawlytics_uploads_safety

# (2) 추적 중이던 data/uploads 를 잠깐 옆으로 빼둠 (pull 충돌 방지)
mv data    /tmp/_data_live
mv uploads /tmp/_uploads_live

# (3) 추적 제외 커밋이 포함된 main 으로 정렬
git fetch origin main
git status            # 다른 미커밋 변경이 없는지 확인 (있으면 먼저 처리)
git reset --hard origin/main

# (4) 실시간 데이터 제자리 복원 (이제 .gitignore 라 추적 안 됨)
rm -rf data uploads
mv /tmp/_data_live    data
mv /tmp/_uploads_live uploads

# (5) 확인: data/uploads 가 git status 에 안 떠야 정상(ignored)
git status

# (6) 앱 재시작
pm2 restart brawlytics
```

이후부터는:
- `git pull origin main` (배포)은 **코드만** 갱신, 서버의 data/uploads 는 절대 안 건드림 → **충돌 없음**
- 관리자 수정 / 매월 자동 동기화는 서버 실시간 파일에만 씀
- 백업 크론이 그 결과를 data-backup 브랜치로 스냅샷

---

## 복원 절차 (서버 교체/데이터 유실 시)
```bash
# 1) 코드
sudo git clone https://github.com/SsangG77/brawlytics_server.git /var/www/brawlytics_server
cd /var/www/brawlytics_server && npm install
# .env (BRAWL_STARS_API_KEY 등) 복원

# 2) 데이터/이미지 (data-backup 브랜치에서)
git clone -b data-backup https://github.com/SsangG77/brawlytics_server.git /tmp/restore
cp -a /tmp/restore/data    /var/www/brawlytics_server/
cp -a /tmp/restore/uploads /var/www/brawlytics_server/

pm2 start index.js --name brawlytics
```

## 특정 시점으로 롤백
```bash
cd /var/www/brawlytics_data_backup
git log --oneline                 # 원하는 백업 커밋 찾기
git checkout <커밋해시> -- data uploads
cp -a data uploads /var/www/brawlytics_server/   # 서버 실시간에 반영
pm2 restart brawlytics
```
