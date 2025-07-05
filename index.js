const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

require('./cron.js');
