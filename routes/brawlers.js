const express = require('express');
const router = express.Router();
const { fetchBrawlStarsData } = require('../services/brawlStarsAPI');
const { validatePlayerTag } = require('../middleware/validatePlayerTag');

router.get('/', validatePlayerTag, async(req, res) => {
    const { playertag } = res.locals;
    try {
        const data = await fetchBrawlStarsData(playertag);
        const brawlersWithoutWinStreak = data.brawlers.map(({ maxWinStreak, currentWinStreak, ...rest }) => rest);
        res.status(200).json(brawlersWithoutWinStreak);
        // res.status(200).json(data.brawlers);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || 'An error occurred while fetching player data' });
    }
});

router.get('/trophy', validatePlayerTag, async(req, res) => {
    const { playertag } = res.locals;
    try {
        const data = await fetchBrawlStarsData(playertag);
        const brawlersTrophy = data.brawlers.map(brawler => ({
            id: brawler.id.toString(),
            name: brawler.name,
            rank: brawler.rank,
            currentTrophy: brawler.trophies,
            highestTrophy: brawler.highestTrophies
        }));
        res.status(200).json(brawlersTrophy);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || 'An error occurred while fetching player data' });
    }
})

module.exports = router;

