const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;

const brawlersRouter = require('./routes/brawlers');
const userRouter = require('./routes/user');
const battlelogRouter = require('./routes/battlelog');
const trophiesRouter = require('./routes/trophies');
const adminRouter = require('./routes/admin');
const hyperchargeRouter = require('./routes/hypercharge');
const buffiesRouter = require('./routes/buffies');
const { initializeBrawlersTable } = require('./services/brawlerService');

app.use('/brawlers', brawlersRouter);
app.use('/user', userRouter);
app.use('/battlelog', battlelogRouter);
app.use('/trophies', trophiesRouter);
app.use('/admin', adminRouter);
app.use('/hypercharge', hyperchargeRouter);
app.use('/buffies', buffiesRouter);

// 관리자 페이지 라우트
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

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
