const express = require('express');
const fetch = require('cross-fetch'); // cross-fetch를 import합니다.
const app = express();

app.use(express.json());
require('dotenv').config();

app.get('/api', (req, res) => {
    res.status(200).json({ message: 'Hello from Vercel!' });
});

app.get("/player", async (req, res) => {
    const apiKey = process.env.BRAWL_STARS_API_KEY;
    const { playerTag } = req.query;

    if (!playerTag) {
        return res.status(400).json({ error: 'Player tag is required' });
    }

    try {
        const response = await fetch(`https://api.brawlstars.com/v1/players/%23${encodeURIComponent(playerTag)}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching player data' });
    }
});

module.exports = app;
