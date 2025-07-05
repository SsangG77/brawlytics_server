
const express = require('express');
const router = express.Router();
const { fetchBrawlStarsData } = require('../services/brawlStarsAPI');
const { validatePlayerTag } = require('../middleware/validatePlayerTag');

router.get('/', validatePlayerTag, async(req, res) => {
    const { playertag } = res.locals;
    try {
        const data = await fetchBrawlStarsData(playertag);
        const user = {
            nickName: data.name,
            club: data.club ? data.club.name : 'No Club',
            total: data.trophies,
            max: data.highestTrophies
        };
        res.status(200).json(user);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || 'An error occurred while fetching player data' });
    }
});

module.exports = router;
