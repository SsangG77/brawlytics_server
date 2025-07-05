
const cron = require('node-cron');
const db = require('./db');
const { fetchBrawlStarsData } = require('./services/brawlStarsAPI');
const { initializeBrawlersTable } = require('./services/brawlerService');

// Helper function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Schedule a task to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily trophy collection job...');
    const today = new Date().toISOString().slice(0, 10);

    try {
        const usersResult = await db.query('SELECT * FROM users');
        const users = usersResult.rows;
        console.log(`Found ${users.length} users to process.`);

        for (const user of users) {
            try {
                console.log(`Fetching trophies for user: ${user.tag}`);
                // The tag from Brawl Stars API might not have '#', but our DB might. Let's be safe.
                const playerTagForAPI = user.tag.startsWith('#') ? user.tag.substring(1) : user.tag;
                const data = await fetchBrawlStarsData(playerTagForAPI);
                const brawlers = data.brawlers;

                for (const brawler of brawlers) {
                    await db.query(
                        'INSERT INTO user_brawler_trophies (user_id, brawler_id, trophy, date) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, brawler_id, date) DO NOTHING',
                        [user.id, brawler.id, brawler.trophies, today]
                    );
                }
                console.log(`Finished fetching trophies for user: ${user.tag}`);

            } catch (error) {
                // Log error for a specific user and continue with the next one
                console.error(`Failed to process user ${user.tag}:`, error.message);
            }

            // Wait for 500ms before processing the next user to avoid rate limiting
            await delay(500);
        }

        console.log('Daily trophy collection job finished.');
    } catch (error) {
        console.error('Error running daily trophy collection job:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Seoul"
});

// Schedule brawlers table initialization to run on the 1st of every month at midnight
cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly brawlers table initialization job...');
    await initializeBrawlersTable();
    console.log('Monthly brawlers table initialization job finished.');
}, {
    scheduled: true,
    timezone: "Asia/Seoul"
});

console.log('Cron job scheduled for daily trophy collection at midnight (Asia/Seoul).');
console.log('Cron job scheduled for monthly brawlers table initialization on the 1st at midnight (Asia/Seoul).');
