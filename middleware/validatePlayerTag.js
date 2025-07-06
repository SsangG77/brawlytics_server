
const validatePlayerTag = (req, res, next) => {
    const { playertag } = req.query;
    if (!playertag) {
        return res.status(400).json({ error: 'Player tag is required' });
    }
    // Remove leading # or %23, then convert to uppercase
    const cleanedPlayerTag = playertag.replace(/^(#|%23)/i, '').toUpperCase();
    res.locals.playertag = `#${cleanedPlayerTag}`;
    next();
};

module.exports = { validatePlayerTag };
