
const fetch = require('cross-fetch');
require('dotenv').config();

const apiKey = process.env.BRAWL_STARS_API_KEY;
// const apiKey = process.env.LOCAL_API_KEY;


const fetchBrawlStarsData = async (playertag, endpoint = '') => {
    // Ensure playertag does not start with # for API call, as %23 is added below
    const cleanedPlayerTag = playertag.startsWith('#') ? playertag.substring(1) : playertag;
    const url = `https://api.brawlstars.com/v1/players/%23${encodeURIComponent(cleanedPlayerTag)}${endpoint}`;
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

const fetchAllBrawlers = async () => {
    const url = `https://api.brawlstars.com/v1/brawlers`;
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

module.exports = { fetchBrawlStarsData, fetchAllBrawlers };

