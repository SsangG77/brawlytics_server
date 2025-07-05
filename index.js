const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/brawlytics-server.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/brawlytics-server.com/fullchain.pem'),
};

const brawlersRouter = require('./routes/brawlers');
const userRouter = require('./routes/user');
const battlelogRouter = require('./routes/battlelog');
const trophiesRouter = require('./routes/trophies');
const adminRouter = require('./routes/admin');
const { initializeBrawlersTable } = require('./services/brawlerService');

app.use('/brawlers', brawlersRouter);
app.use('/user', userRouter);
app.use('/battlelog', battlelogRouter);
app.use('/trophies', trophiesRouter);
app.use('/', adminRouter);

app.get('/app-ads.txt', (req, res) => {
	res.sendFile(path.join(__dirname, 'app-ads.txt'));
});


app.get('/', (req, res) => {
    res.send('Hello, Sangjin!');
});

if (process.env.NODE_ENV === 'production') {
    // Production environment (e.g., GCP VM with direct HTTPS)

    // HTTP to HTTPS redirect
    require('http').createServer((req, res) => {
        res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
        res.end();
    }).listen(PORT, () => {
        console.log(`HTTP server running on port ${PORT}, redirecting to HTTPS.`);
    });

    // HTTPS server
    https.createServer(options, app).listen(HTTPS_PORT, () => {
        console.log(`HTTPS server running on port ${HTTPS_PORT}`);
    });
} else {
    // Development environment (local)
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

require('./cron.js');
