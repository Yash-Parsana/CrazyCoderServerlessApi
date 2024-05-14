const express = require('express');
const dailyChallengesRouter = express.Router();
const leetcodeDailyChallenge = require('../controller/dailyChallengeController');

dailyChallengesRouter.get('/leetcode', leetcodeDailyChallenge);
