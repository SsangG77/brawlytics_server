
const express = require('express');
const router = express.Router();
const { initializeBrawlersTable } = require('../services/brawlerService');

router.get('/save', async (req, res) => {
    console.log('Manually triggering brawlers table initialization...');
    try {
        await initializeBrawlersTable();
        res.status(200).json({ message: 'Brawlers table initialization triggered successfully.' });
    } catch (error) {
        console.error('Error manually triggering brawlers table initialization:', error);
        res.status(500).json({ error: 'Failed to trigger brawlers table initialization.' });
    }
});

module.exports = router;
