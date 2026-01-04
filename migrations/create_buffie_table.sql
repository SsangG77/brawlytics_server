-- 버피 소유 정보 테이블
CREATE TABLE IF NOT EXISTS user_buffies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_tag VARCHAR(20) NOT NULL,
    buffie_name VARCHAR(100) NOT NULL,
    buffie_type VARCHAR(20) NOT NULL CHECK (buffie_type IN ('gadget', 'starPower', 'hypercharge')),
    owned BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 동일한 플레이어가 동일한 버피를 중복 저장하지 않도록
    UNIQUE(user_id, buffie_name)
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_buffie_player_tag ON user_buffies(player_tag);
CREATE INDEX IF NOT EXISTS idx_buffie_user_id ON user_buffies(user_id);
CREATE INDEX IF NOT EXISTS idx_buffie_type ON user_buffies(buffie_type);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_buffies_updated_at
    BEFORE UPDATE ON user_buffies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
