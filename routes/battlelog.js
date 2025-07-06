const express = require('express');
const router = express.Router();
const { fetchBrawlStarsData } = require('../services/brawlStarsAPI');
const { validatePlayerTag } = require('../middleware/validatePlayerTag');
const { randomUUID } = require('crypto');

// Helper function to format player data
const formatPlayer = (player, starPlayerTag) => ({
  id: randomUUID(),
  name: player.name,
  brawler: player.brawler.name,
  power: player.brawler.power,
  starPlayer: starPlayerTag === player.tag,
});

// Helper function to format team data
const formatTeams = (battle) => {
  const isShowdown = battle.mode.toLowerCase().includes('showdown');

  if (battle.mode === 'soloShowdown') {
    return [{
      id: randomUUID(),
      member: battle.players.map(player => formatPlayer(player, null)),
    }];
  }

  const starPlayerTag = !isShowdown && battle.starPlayer ? battle.starPlayer.tag : null;
  return battle.teams.map(team => ({
    id: randomUUID(),
    member: team.map(player => formatPlayer(player, starPlayerTag)),
  }));
};

// Helper function to format the date
const formatDate = (battleTime) => {
  const year = battleTime.substring(0, 4);
  const month = battleTime.substring(4, 6);
  const day = battleTime.substring(6, 8);
  return `${year}/${month}/${day}`;
};

// Helper function to transform a single battle log item
const transformBattleItem = (item) => ({
  id: randomUUID(),
  result: item.battle.result || 'showdown',
  mode: item.event.mode !== "trioShowdown" ? item.battle.mode : "trioShowdown",
  mapName: item.event.map,
  date: formatDate(item.battleTime),
  teams: formatTeams(item.battle),
});

router.get('/', validatePlayerTag, async (req, res) => {
  const { playertag } = res.locals;
  try {
    const { items } = await fetchBrawlStarsData(playertag, '/battlelog');

    const result = items
      .sort((a, b) => new Date(b.battleTime) - new Date(a.battleTime))
      .slice(0, 60)
      .map(transformBattleItem);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching battle log:', error);
    const status = error.status || 500;
    const message = error.data && error.data.reason ? error.data.reason : 'An error occurred while fetching player data';
    res.status(status).json({ error: message });
  }
});

module.exports = router;