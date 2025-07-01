
const fs = require('fs');
const https = require('https');
const express = require('express');
const fetch = require('cross-fetch');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));


require('dotenv').config();


const PORT = 80;
const HTTPS_PORT = 443;

const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/brawlytics-server.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/brawlytics-server.com/fullchain.pem'),
};

app.get('/app-ads.txt', (req, res) => {
	res.sendFile(path.join(__dirname, 'app-ads.txt'));
});


app.get('/', (req, res) => {
    res.send('Hello, Sangjin!');
});

app.get('/brawlers', async(req, res) => {
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

const http = require('http');
http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
}).listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}, redirecting to HTTPS.`);
});

https.createServer(options, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPS server running on port ${HTTPS_PORT}`);
});
