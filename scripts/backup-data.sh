#!/usr/bin/env bash
#
# brawlers.json + uploads 이미지를 data-backup 브랜치로 스냅샷 백업한다.
#
# 동작:
#   1) 백업용 클론을 data-backup 브랜치 최신 상태로 정렬
#   2) 서버 앱 폴더의 실시간 data/ , uploads/ 를 백업 폴더로 미러링(삭제도 반영)
#   3) 변경이 있으면 commit & push  (없으면 건너뜀)
#
# deploy.yml 은 main 브랜치만 감시하므로 이 push 는 배포를 트리거하지 않는다.
#
# crontab 예시 (매일 새벽 4시):
#   0 4 * * * /var/www/brawlytics_server/scripts/backup-data.sh >> /var/log/brawlytics-backup.log 2>&1
#
# 환경변수로 경로/브랜치 덮어쓰기 가능 (기본값은 아래).

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/brawlytics_server}"
BACKUP_DIR="${BACKUP_DIR:-/var/www/brawlytics_data_backup}"
BACKUP_BRANCH="${BACKUP_BRANCH:-data-backup}"

log() { echo "[backup-data $(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if [ ! -d "$APP_DIR/data" ] && [ ! -d "$APP_DIR/uploads" ]; then
  log "오류: 앱 데이터 폴더를 찾을 수 없음 ($APP_DIR). APP_DIR 확인 필요."
  exit 1
fi

if [ ! -d "$BACKUP_DIR/.git" ]; then
  log "오류: 백업용 클론이 없음 ($BACKUP_DIR). DATA-BACKUP-SETUP.md 의 초기 세팅 참고."
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  log "오류: rsync 가 필요함. (Ubuntu: sudo apt-get install -y rsync)"
  exit 1
fi

cd "$BACKUP_DIR"

# 1) 백업 브랜치를 원격 최신 상태로 정렬
git fetch origin "$BACKUP_BRANCH"
git checkout "$BACKUP_BRANCH"
git reset --hard "origin/$BACKUP_BRANCH"

# 2) 실시간 데이터를 백업 폴더로 미러링 (.git 은 건드리지 않음)
mkdir -p "$BACKUP_DIR/data" "$BACKUP_DIR/uploads"
rsync -a --delete "$APP_DIR/data/"    "$BACKUP_DIR/data/"
rsync -a --delete "$APP_DIR/uploads/" "$BACKUP_DIR/uploads/"

git add -A data uploads

# 3) 변경 없으면 종료
if git diff --cached --quiet; then
  log "변경 없음 — 백업 건너뜀."
  exit 0
fi

git commit -m "데이터 백업 $(date '+%Y-%m-%d %H:%M:%S %z')"
git push origin "$BACKUP_BRANCH"
log "백업 완료 → $BACKUP_BRANCH"
