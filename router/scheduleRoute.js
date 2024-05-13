const express=require('express')
const { atCoderSchedule,codechefSchedule,codeforcesSchedule,hackerRankSchedule,hackerEarthSchedule,leetCodeSchedule, gfgSchedule } = require('../controller/scheduleController')
const scheduleRouter = express.Router()

scheduleRouter.get('/at_coder', atCoderSchedule)
scheduleRouter.get('/code_chef', codechefSchedule)
scheduleRouter.get('/codeforces', codeforcesSchedule)
scheduleRouter.get('/hacker_rank', hackerRankSchedule)
scheduleRouter.get('/hacker_earth', hackerEarthSchedule)
// scheduleRouter.get('/kick_start', kickStartSchedule)
scheduleRouter.get('/leet_code', leetCodeSchedule)
scheduleRouter.get('/geeks_for_geeks', gfgSchedule); 



module.exports=scheduleRouter