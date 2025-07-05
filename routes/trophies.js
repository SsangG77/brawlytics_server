
const express = require('express');
const router = express.Router();
const db = require('../db');
const { fetchBrawlStarsData } = require('../services/brawlStarsAPI');
const { validatePlayerTag } = require('../middleware/validatePlayerTag');

router.get('/', validatePlayerTag, async (req, res) => {
    const { playertag } = res.locals;
    const { brawlerName } = req.query; // Get brawlerName from query params
    const today = new Date().toISOString().slice(0, 10);



    try {
        // 1. Check if user exists, or create them if they don't.
        let userResult = await db.query('SELECT * FROM users WHERE tag = $1', [playertag]);
        let userId;

        if (userResult.rows.length === 0) {
            console.log(`New user: ${playertag}. Creating entry and fetching initial data.`);
            // If user doesn't exist, create them
            userResult = await db.query('INSERT INTO users (tag) VALUES ($1) RETURNING id', [playertag]);
            userId = userResult.rows[0].id;

            // Fetch initial trophy data for ALL brawlers and save it
            const data = await fetchBrawlStarsData(playertag.substring(1));
            const brawlers = data.brawlers;

            for (const brawler of brawlers) {
                await db.query(
                    'INSERT INTO user_brawler_trophies (user_id, brawler_id, trophy, date) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, brawler_id, date) DO NOTHING',
                    [userId, brawler.id, brawler.trophies, today]
                );
            }
            console.log(`Initial data for ${playertag} has been stored.`);
        } else {
            userId = userResult.rows[0].id;
        }

        // 2. Fetch last 90 days of trophy data for the user.
        //    Filter by brawlerName if it's provided.
        let queryText = `
            SELECT ubt.trophy, ubt.date
            FROM user_brawler_trophies ubt
            JOIN brawlers b ON ubt.brawler_id = b.id
            WHERE ubt.user_id = $1 AND ubt.date >= current_date - interval '90' day
        `;
        const queryParams = [userId];

        if (brawlerName) {
            // Get brawlerId from brawlerName
            const brawlerResult = await db.query('SELECT id FROM brawlers WHERE name = $1', [brawlerName.toUpperCase()]);
            if (brawlerResult.rows.length === 0) {
                return res.status(404).json({ error: `Brawler with name ${brawlerName} not found.` });
            }
            const brawlerId = brawlerResult.rows[0].id;

            console.log(`Fetching trophy history for user ${playertag} and brawler ${brawlerName} (ID: ${brawlerId})`);
            queryText += ' AND ubt.brawler_id = $2';
            queryParams.push(brawlerId);
        } else {
            console.log(`Fetching all trophy history for user ${playertag}`);
        }

        queryText += ' ORDER BY ubt.date DESC';

        const trophyHistory = await db.query(queryText, queryParams);

        // Format date to MM/DD
        const formattedTrophyHistory = trophyHistory.rows.map(row => {
            const date = new Date(row.date);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return {
                trophy: row.trophy,
                date: `${month}/${day}`
            };
        });

        res.status(200).json(formattedTrophyHistory);

    } catch (error) {
        console.error('Error in /trophies endpoint:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

module.exports = router;
