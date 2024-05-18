const express=require('express')
const { atCoderSchedule,codechefSchedule,codeforcesSchedule,hackerRankSchedule,hackerEarthSchedule,leetCodeSchedule, gfgSchedule, codingNinjasSchedule } = require('../controller/scheduleController')
const scheduleRouter = express.Router()

scheduleRouter.get('/at_coder', atCoderSchedule)
scheduleRouter.get('/code_chef', codechefSchedule)
scheduleRouter.get('/codeforces', codeforcesSchedule)
scheduleRouter.get('/hacker_rank', hackerRankSchedule)
scheduleRouter.get('/hacker_earth', hackerEarthSchedule)
// scheduleRouter.get('/kick_start', kickStartSchedule)
scheduleRouter.get('/leet_code', leetCodeSchedule)
scheduleRouter.get('/geeks_for_geeks', gfgSchedule); 
scheduleRouter.get('/coding_ninjas',codingNinjasSchedule)



module.exports=scheduleRouter