-- 하이퍼차지 소유 정보 테이블
CREATE TABLE IF NOT EXISTS user_hypercharges (
    id SERIAL PRIMARY KEY,
    player_tag VARCHAR(20) NOT NULL,
    hypercharge_name VARCHAR(100) NOT NULL,
    owned BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 동일한 플레이어가 동일한 하이퍼차지를 중복 저장하지 않도록
    UNIQUE(player_tag, hypercharge_name)
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_player_tag ON user_hypercharges(player_tag);
CREATE INDEX IF NOT EXISTS idx_player_hypercharge ON user_hypercharges(player_tag, hypercharge_name);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_hypercharges_updated_at
    BEFORE UPDATE ON user_hypercharges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
