-- Supabase용 버피 테이블 생성 쿼리

-- 1. users 테이블이 없다면 생성 (이미 있다면 이 부분은 스킵)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tag VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. update_updated_at_column 함수가 없다면 생성 (이미 있다면 스킵)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. 버피 소유 정보 테이블 생성
CREATE TABLE IF NOT EXISTS user_buffies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_tag VARCHAR(20) NOT NULL,
    buffie_name VARCHAR(100) NOT NULL,
    buffie_type VARCHAR(20) NOT NULL CHECK (buffie_type IN ('gadget', 'starPower', 'hypercharge')),
    owned BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 동일한 유저가 동일한 버피를 중복 저장하지 않도록
    UNIQUE(user_id, buffie_name)
);

-- 4. 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_buffie_player_tag ON user_buffies(player_tag);
CREATE INDEX IF NOT EXISTS idx_buffie_user_id ON user_buffies(user_id);
CREATE INDEX IF NOT EXISTS idx_buffie_type ON user_buffies(buffie_type);

-- 5. updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_user_buffies_updated_at ON user_buffies;
CREATE TRIGGER update_user_buffies_updated_at
    BEFORE UPDATE ON user_buffies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS) 활성화 (선택사항)
ALTER TABLE user_buffies ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 생성 (모든 사용자가 읽기/쓰기 가능하도록 설정 - 필요에 따라 수정)
DROP POLICY IF EXISTS "Enable read access for all users" ON user_buffies;
CREATE POLICY "Enable read access for all users" ON user_buffies
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON user_buffies;
CREATE POLICY "Enable insert access for all users" ON user_buffies
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON user_buffies;
CREATE POLICY "Enable update access for all users" ON user_buffies
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON user_buffies;
CREATE POLICY "Enable delete access for all users" ON user_buffies
    FOR DELETE USING (true);

-- 8. 테이블 확인
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_buffies'
ORDER BY ordinal_position;
