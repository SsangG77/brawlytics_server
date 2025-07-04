const fs = require('fs');
const https = require('https');
const express = require('express');
const fetch = require('cross-fetch');
const path = require('path');
const { randomUUID } = require('crypto');


const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

require('dotenv').config();
const apiKey = process.env.BRAWL_STARS_API_KEY;

// Helper function to fetch data from Brawl Stars API
const fetchBrawlStarsData = async (playertag, endpoint = '') => {
    const url = `https://api.brawlstars.com/v1/players/%23${encodeURIComponent(playertag)}${endpoint}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        const error = new Error('API request failed');
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    return response.json();
};

// Middleware to handle common request validation
const validatePlayerTag = (req, res, next) => {
    const { playertag } = req.query;
    if (!playertag) {
        return res.status(400).json({ error: 'Player tag is required' });
    }
    res.locals.playertag = playertag;
    next();
};


// const PORT = 80;
// const HTTPS_PORT = 443;

// const options = {
//     key: fs.readFileSync('/etc/letsencrypt/live/brawlytics-server.com/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/brawlytics-server.com/fullchain.pem'),
// };

app.get('/app-ads.txt', (req, res) => {
	res.sendFile(path.join(__dirname, 'app-ads.txt'));
});


app.get('/', (req, res) => {
    res.send('Hello, Sangjin!');
});

app.get('/brawlers', validatePlayerTag, async(req, res) => {
    const { playertag } = res.locals;
    try {
        const data = await fetchBrawlStarsData(playertag);
        res.status(200).json(data.brawlers);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || 'An error occurred while fetching player data' });
    }
});

app.get('/user', validatePlayerTag, async(req, res) => {
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


app.get('/brawlersTrophy', validatePlayerTag, async(req, res) => {
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


app.get('/battlelog', validatePlayerTag, async(req, res) => {
    const { playertag } = res.locals;
    try {
        const data = await fetchBrawlStarsData(playertag, '/battlelog');
       const result = data.items
        .sort((a, b) => {
            // 최신순 정렬
            return new Date(b.battleTime) - new Date(a.battleTime);
        })
        .slice(0, 60) // 상위 60개만 추출
        .map(item => {
            const battleTime = item.battleTime;
            const year = battleTime.substring(0, 4);
            const month = battleTime.substring(4, 6);
            const day = battleTime.substring(6, 8);

            return {
                id: randomUUID(),
                result: item.battle.result,
                mode: item.battle.mode,
                mapName: item.event.map,
                date: `${year}/${month}/${day}`,
                teams: item.battle.teams.map(team => {
                    return {
                        id: randomUUID(),
                        member: team.map(member => {
                            return {
                                id: randomUUID(),
                                name: member.name,
                                brawler: member.brawler.name,
                                power: member.brawler.power,
                                starPlayer: item.battle.starPlayer && item.battle.starPlayer.tag === member.tag
                            };
                        })
                    };
                })
            };
        });

        // console.log(result);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || 'An error occurred while fetching player data' });
    }
})




// const http = require('http');
// http.createServer((req, res) => {
//     res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
//     res.end();
// }).listen(PORT, () => {
//     console.log(`HTTP server running on port ${PORT}, redirecting to HTTPS.`);
// });

// https.createServer(options, app).listen(HTTPS_PORT, () => {
//     console.log(`HTTPS server running on port ${HTTPS_PORT}`);
// });

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});