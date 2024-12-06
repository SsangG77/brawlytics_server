const express = require('express');
const fetch = require('cross-fetch'); // cross-fetch를 import합니다.
const app = express();

app.use(express.json());
require('dotenv').config();




//========================================================================== [ /api ] ===========================================================
app.get('/api', (req, res) => {
    res.status(200).json({ message: 'Hello from Vercel!' });
});






//========================================================================== [ /brawlers ] ===========================================================
app.get("/brawlers", async (req, res) => {

    const apiKey = process.env.BRAWL_STARS_API_KEY;
    const { playertag } = req.query;

    if (!playertag) {
        return res.status(400).json({ error: 'Player tag is required' });
    }



    try {
        const response = await fetch(`https://api.brawlstars.com/v1/players/%23${encodeURIComponent(playertag)}`, {
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
        // console.log(data.brawlers)
        res.status(200).json(data.brawlers);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching player data' });
    }
});



//========================================================================== [ listen ] ===========================================================
app.listen(4000, () => {
    console.log("서버가 4000번 포트에서 실행 중입니다.");
  });

module.exports = app;
