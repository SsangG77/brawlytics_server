
const validatePlayerTag = (req, res, next) => {
    const { playertag } = req.query;
    if (!playertag) {
        return res.status(400).json({ error: 'Player tag is required' });
    }
    const formattedPlayerTag = '#' + playertag.toUpperCase().replace(/^#/, '');
    res.locals.playertag = formattedPlayerTag;
    next();
};

module.exports = { validatePlayerTag };
