const express = require('express');
const cors =require('cors')
const serverless = require('serverless-http');

const app = express();
app.use(cors());

const router = express.Router();

const scheduleRouter = require('../router/scheduleRoute');
const ratingRouter = require('../router/ratingRouter');

router.use('/schedule', scheduleRouter);
router.use('/rankings', ratingRouter);

router.get('/', (req,res) => {
    res.send("You are in default Route")
});

app.use('/', router);

module.exports.handler = serverless(app);

//app.listen(3000, () => {
//     console.log("Server is Runnig on Port : ",3000);
//})
