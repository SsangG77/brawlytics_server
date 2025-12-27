const express = require('express');
const router = express.Router();
const db = require('../db');

// 하이퍼차지 소유 정보 저장/업데이트
router.post('/', async (req, res) => {
    const { playerTag, hyperchargeName, owned } = req.body;

    // 필수 파라미터 검증
    if (!playerTag || !hyperchargeName || owned === undefined) {
        return res.status(400).json({
            error: 'playerTag, hyperchargeName, and owned are required'
        });
    }

    // playerTag 정규화 (대문자, # 포함)
    const normalizedPlayerTag = playerTag.startsWith('#')
        ? playerTag.toUpperCase()
        : `#${playerTag.toUpperCase()}`;

    try {
        // 1. users 테이블에서 user_id 조회 또는 생성
        let userResult = await db.query(
            'SELECT id FROM users WHERE tag = $1',
            [normalizedPlayerTag]
        );

        let userId;
        if (userResult.rows.length === 0) {
            // 유저가 없으면 생성
            userResult = await db.query(
                'INSERT INTO users (tag) VALUES ($1) RETURNING id',
                [normalizedPlayerTag]
            );
            userId = userResult.rows[0].id;
        } else {
            userId = userResult.rows[0].id;
        }

        // 2. user_hypercharges에 UPSERT
        const result = await db.query(
            `INSERT INTO user_hypercharges (user_id, player_tag, hypercharge_name, owned)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, hypercharge_name)
             DO UPDATE SET owned = $4, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, normalizedPlayerTag, hyperchargeName, owned]
        );

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error saving hypercharge:', error);
        res.status(500).json({
            error: 'Failed to save hypercharge data',
            details: error.message
        });
    }
});

// 특정 플레이어의 하이퍼차지 목록 조회
router.get('/', async (req, res) => {
    const { playerTag } = req.query;

    if (!playerTag) {
        return res.status(400).json({ error: 'playerTag is required' });
    }

    // playerTag 정규화
    const normalizedPlayerTag = playerTag.startsWith('#')
        ? playerTag.toUpperCase()
        : `#${playerTag.toUpperCase()}`;

    try {
        // 1. users 테이블에서 user_id 조회
        const userResult = await db.query(
            'SELECT id FROM users WHERE tag = $1',
            [normalizedPlayerTag]
        );

        if (userResult.rows.length === 0) {
            // 유저가 없으면 빈 배열 반환
            return res.status(200).json({
                playerTag: normalizedPlayerTag,
                hypercharges: []
            });
        }

        const userId = userResult.rows[0].id;

        // 2. user_hypercharges에서 조회
        const result = await db.query(
            `SELECT hypercharge_name, owned, updated_at
             FROM user_hypercharges
             WHERE user_id = $1 AND owned = true`,
            [userId]
        );

        res.status(200).json({
            playerTag: normalizedPlayerTag,
            hypercharges: result.rows
        });
    } catch (error) {
        console.error('Error fetching hypercharges:', error);
        res.status(500).json({
            error: 'Failed to fetch hypercharge data',
            details: error.message
        });
    }
});

module.exports = router;
