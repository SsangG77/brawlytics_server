const express = require('express');
const router = express.Router();
const db = require('../db');

// 버피 소유 정보 저장/업데이트
router.post('/', async (req, res) => {
    const { playerTag, buffieName, buffieType, owned } = req.body;

    // 필수 파라미터 검증
    if (!playerTag || !buffieName || !buffieType || owned === undefined) {
        return res.status(400).json({
            error: 'playerTag, buffieName, buffieType, and owned are required'
        });
    }

    // buffieType 검증
    if (!['gadget', 'starPower', 'hypercharge'].includes(buffieType)) {
        return res.status(400).json({
            error: 'buffieType must be one of: gadget, starPower, hypercharge'
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

        // 2. user_buffies에 UPSERT
        const result = await db.query(
            `INSERT INTO user_buffies (user_id, player_tag, buffie_name, buffie_type, owned)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, buffie_name)
             DO UPDATE SET owned = $5, buffie_type = $4, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, normalizedPlayerTag, buffieName, buffieType, owned]
        );

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error saving buffie:', error);
        res.status(500).json({
            error: 'Failed to save buffie data',
            details: error.message
        });
    }
});

// 특정 플레이어의 버피 목록 조회
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
                buffies: []
            });
        }

        const userId = userResult.rows[0].id;

        // 2. user_buffies에서 조회
        const result = await db.query(
            `SELECT buffie_name, buffie_type, owned, updated_at
             FROM user_buffies
             WHERE user_id = $1 AND owned = true`,
            [userId]
        );

        res.status(200).json({
            playerTag: normalizedPlayerTag,
            buffies: result.rows
        });
    } catch (error) {
        console.error('Error fetching buffies:', error);
        res.status(500).json({
            error: 'Failed to fetch buffie data',
            details: error.message
        });
    }
});

module.exports = router;
