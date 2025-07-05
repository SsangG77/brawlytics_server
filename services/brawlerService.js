
const db = require('../db');
const { fetchAllBrawlers } = require('./brawlStarsAPI');

async function initializeBrawlersTable() {
    console.log('Initializing brawlers table...');
    try {
        const brawlersData = await fetchAllBrawlers();
        const brawlers = brawlersData.items;

        for (const brawler of brawlers) {
            await db.query(
                'INSERT INTO brawlers (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
                [brawler.id, brawler.name]
            );
        }
        console.log(`Brawlers table initialized with ${brawlers.length} brawlers.`);
    } catch (error) {
        console.error('Error initializing brawlers table:', error);
    }
}

module.exports = { initializeBrawlersTable };
