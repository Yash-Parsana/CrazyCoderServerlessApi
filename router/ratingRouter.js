const express = require('express')
const {atCoderRating, codechefRating,codeforcesRating,leetCodeRating,codingNinjasRating, GeeksForGeeksProfile} = require('../controller/ratingsController')

const ratingRouter = express.Router();

ratingRouter.get('/code_chef/:username', codechefRating)
ratingRouter.get('/codeforces/:users',codeforcesRating)
ratingRouter.get('/at_coder/:username',atCoderRating)
ratingRouter.get('/leet_code/:username',leetCodeRating)
ratingRouter.get('/coding_ninjas/:username',codingNinjasRating)
ratingRouter.get('/geeks_for_geeks/:username',GeeksForGeeksProfile)

module.exports=ratingRouter