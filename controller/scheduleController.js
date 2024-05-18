const axios = require('axios')
const cheerio = require('cheerio')
const pretty = require('pretty')
const fetch=require('node-fetch')
const url = require('url');
const puppeteer = require('puppeteer')

const atCoderUrl = "https://atcoder.jp/contests"
const codeChefUrl = "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all"
const codeforcesUrl="https://codeforces.com/api/contest.list?"
const hackerRankUrl = "https://www.hackerrank.com/rest/contests/upcoming?limit=100"
const hackerEarthUrl = "https://www.hackerearth.com/chrome-extension/events/"
const kickStartUrl = "https://codingcompetitions.withgoogle.com/kickstart/schedule"
const leetCodeUrl="https://leetcode.com/graphql?query={%20allContests%20{%20title%20titleSlug%20startTime%20duration%20__typename%20}%20}"

const atCoderSchedule = async (req, res) => {
    
    //res array object
    // {
    //     name: "",
    //     start_time: "",
    //     end_time: "",
    //     status:""
    // }

    const jsonArray=[]

    const {data} =await axios.get(atCoderUrl)
    
    const $ = cheerio.load(data)
    
    const contests=$(".table-default tbody tr")


    contests.each((idx, ele) => {
        
        const curr=cheerio.load(ele)
        
        const name = pretty((curr("td:nth-child(2) a")).html())
        const Stime = parseInt(Date.parse((pretty(curr("td:nth-child(1) a time").html())))) //from 2023-01-28(Sat) 08:30 to timestamp
        const str = pretty(curr("td:nth-child(3)").html()).toString()
        const hour = parseInt(str.split(":")[0])
        const minute=parseInt(str.split(":")[1])
        const Etime = Stime + hour * 60 * 60 * 1000 + minute * 60 * 1000


        if ((!isNaN(Stime)&&!isNaN(Etime))&&Etime > Date.now()) //avoiding finished contest and practice contest
        {
            const status=Date.now()>Stime?"ongoing":"upcoming"
            const obj = {
                name: name,
                start_time: Stime,
                end_time: Etime,
                status:status
            }
            jsonArray.push(obj);
        }
    })
    res.status(200).send(jsonArray);
}

const codechefSchedule = async (req, res) => {
    
    const response=await fetch(codeChefUrl,{method: 'GET'})
    const jsonArray = []
    if (response.ok)
    {
        const jsonObject = await response.json()
        if (jsonObject.status != "success")
        {
            res.status(503).json({
                success: false,
                message:"Sorry! We are not avaiable now"
            })
        }
        else {
            
            const presentContest = jsonObject.present_contests
            const futureContest=jsonObject.future_contests

            for (let i = 0; i < presentContest.length; i++)
            {
                const curr =presentContest[i]
                
                if (curr.contest_code != "GAMES")
                {
                    // const contestStartISODate = curr.contest_start_date_iso;
                    // const contestEndISODate = curr.contest_end_date_iso;
                    // const contestStart = new Date(contestStartISODate);
                    // const contestEnd = new Date(contestEndISODate);
                    const contestStartUTC = Date.parse(curr.contest_start_date_iso);
                    const contestEndUTC = Date.parse(curr.contest_end_date_iso)

                    // contestStartUTC will be a JavaScript Date object representing the contest start time in UTC timezone
                    //new Date(contestStart.getTime() + contestStart.getTimezoneOffset() * 60 * 1000)
                    const obj = {
                        name: curr.contest_name,
                        start_time:contestStartUTC,
                        end_time: contestEndUTC,
                        status:"ongoing"
                    }
                    jsonArray.push(obj)
                }
            }
            for (let i = 0; i < futureContest.length; i++)
            {
                const curr =futureContest[i]

                const obj = {
                    name: curr.contest_name,
                    start_time:Date.parse(curr.contest_start_date_iso),
                    end_time: Date.parse(curr.contest_end_date_iso),
                    status:"upcoming"
                }
                jsonArray.push(obj)
            }
        }
    }
    else {
        res.status(503).json({
            success: false,
            message:"Sorry! We are not avaiable now"
        })
    }
    // console.log(jsonObject);


    res.status(200).send(jsonArray)
}

const codeforcesSchedule = async (req, res) => {
    
    const response = await fetch(codeforcesUrl, { method: "GET" })
    const jsonArray=[]
    if (response.ok)
    {
        const jsonObject = await response.json();
        if (jsonObject.status == "OK")
        {
            const arr = jsonObject.result
            
            for (let i = 0; i < arr.length; i++)
            {
                const curr = arr[i]
                if (curr.phase == "BEFORE"||curr.phase=="CODING")
                {
                    const obj = {
                        name: curr.name,
                        start_time: (curr.startTimeSeconds)*1000,
                        end_time: (curr.startTimeSeconds + curr.durationSeconds) * 1000,
                        status:(curr.phase=="BEFORE")?"upcoming":"ongoing"
                    }
                    jsonArray.push(obj)
                }
            }
            
        }
    }
    else {
        res.status(503).json({
            success: false,
            message:"Can not load Contest"
        })
    }

    res.status(200).send(jsonArray)

}

const hackerRankSchedule = async (req, res) => {
    
    const response = await fetch(hackerRankUrl, { method: "GET" })
    
    const jsonArray=[]
    if (response.ok)
    {
        const jsonObject = await response.json();
        
        const arr = jsonObject.models
        for (let i = 0; i < arr.length; i++)
        {
            const curr = arr[i]
            if (!(curr.ended))
            {
                const obj = {
                    name: curr.name,
                    start_time: curr.epoch_starttime*1000,
                    end_time:curr.epoch_endtime*1000,
                    status:curr.started? "ongoing":"upcoming"
                }
                jsonArray.push(obj)
            }
        }
    }
    else {
        res.status(503).json({
            success: false,
            message:"Can not load Contest"
        })
    }
    res.status(200).send(jsonArray)
}

const hackerEarthSchedule = async (req, res) => {
    
    const response = await fetch(hackerEarthUrl, { method: "GET" })
    const jsonArray=[]
    if (response.ok)
    {
        const jsonObject = await response.json()
        const arr = jsonObject.response
        
        for (let i = 0; i < arr.length; i++)
        {
            const curr=arr[i]
            const obj = {
                name: curr.title,
                start_time:parseInt(Date.parse(curr.start_tz)),
                end_time: parseInt(Date.parse(curr.end_tz)),
                status: curr.status.toString().toLowerCase()
            }
            jsonArray.push(obj)
        }
    }
    else {
        res.status(503).json({
            success: false,
            message:"Can not load Contest"
        })
    }
    res.status(200).send(jsonArray)
}

// const kickStartSchedule = async (req, res) => {
    
//     //using puppeteer
//     const browser = await puppeteer.launch({});
//     const page = await browser.newPage();
//     await page.goto(kickStartUrl);
  
//     await page.waitForSelector('.schedule-row__upcoming');

//     const htmlpage = await page.evaluate(() => document.body.innerHTML);

//     // console.log(htmlpage);
//     const $=cheerio.load(htmlpage)
    
//     const contests = $(".schedule-row__upcoming")
//     const jsonArray=[]
//     contests.each((idx, ele) => {
//         const curr = cheerio.load(ele)
//         const name = pretty(curr("div:nth-child(1) span").html())
//         const start_time = Date.parse(pretty(curr("div:nth-child(2) span").html()))
//         const end_time = Date.parse(pretty(curr("div:nth-child(3) span").html()))
//         const obj = {
//             name: name,
//             start_time: start_time,
//             end_time: end_time,
//             status:start_time<Date.now()?"ongoing":"upcoming"
//         }
//         jsonArray.push(obj)
//     })
//     console.log(jsonArray);
//     await browser.close();
//     res.status(200).send(jsonArray)

//     //using nightmarejs
//     // const nightmare = Nightmare({ show: false });

//     // const jsonArray=[]
//     // await nightmare
//     //   .goto('https://codingcompetitions.withgoogle.com/kickstart/schedule')
//     //   .wait('.schedule-row__upcoming')
//     //   .evaluate(() => {
//     //     return document.body.innerHTML;
//     //   })
//     //   .end()
//     //     .then(htmlpage => {
//     //       console.log("got");
//     //     const $=cheerio.load(htmlpage)
    
//     //     const contests = $(".schedule-row__upcoming")
//     //     contests.each((idx, ele) => {
//     //         const curr = cheerio.load(ele)
//     //         const name = pretty(curr("div:nth-child(1) span").html())
//     //         const start_time = Date.parse(pretty(curr("div:nth-child(2) span").html()))
//     //         const end_time = Date.parse(pretty(curr("div:nth-child(3) span").html()))
//     //         const obj = {
//     //             name: name,
//     //             start_time: start_time,
//     //             end_time: end_time,
//     //             status:start_time<Date.now()?"ongoing":"upcoming"
//     //         }
//     //         jsonArray.push(obj)
//     //     })
//     // });
//     // res.status(200).send(jsonArray)
// }

const leetCodeSchedule = async (req,res) => {
    
    const response = await fetch(leetCodeUrl)
    const jsonArray = []
    if (response.ok) {
        
        const jsonObject = await response.json()
        
        const arr = jsonObject.data.allContests
        for (let i = 0; i < arr.length; i++)
        {
            const curr = arr[i]
            const name = curr.title
            const Stime = curr.startTime*1000
            const Etime = Stime + curr.duration * 1000
            if (Etime > Date.now())
            {
                const obj = {
                    name: name,
                    start_time: Stime,
                    end_time: Etime,
                    status:Stime<Date.now()?"ongoing":"upcoming"
                }
                jsonArray.push(obj)
            }
        }
    }
    else {
        res.status(503).json({
            success: false,
            message:"Could not load Data"
        })
    }
    res.status(200).send(jsonArray)
}

const gfgSchedule = async (req, res) => {
    try {
        let contests = [];
        let page = 1;

        while (true) {
            let gfgUrl = `https://practiceapi.geeksforgeeks.org/api/v1/events/?type=contest&page_number=${page}&sub_type=all`;
            let response = await axios.get(gfgUrl);

            if (!response.data || !response.data['results']) {
                break;
            }

            let upcoming = response.data['results']['upcoming'];
            let past = response.data['results']['past'];
            let allContests = upcoming.concat(past);

            for (let c of allContests) {
                let startTime = new Date(c['start_time']).getTime();
                let endTime = new Date(c['end_time']).getTime();
                let now = Date.now();

                let status;
                if (now < startTime) {
                    status = "upcoming";
                } else if (now >= startTime && now <= endTime) {
                    status = "ongoing";
                } else {
                    continue; 
                }

                contests.push({
                    'name': c['name'] || c['title'],
                    'start_time': startTime,
                    'end_time': endTime,
                    'status': status
                });
            }

            if (!process.argv.includes('parse_full_list')) {
                break;
            }

            page += 1;
        }

        res.json(contests); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

const codingNinjasSchedule = async (req, res) => {
    let page = 0;
    let stop = false;
    let limit = 25;
    let jsonArray = [];
    const now = Date.now(); 

    while (!stop) {
        page += 1;
        const url = `https://api.codingninjas.com/api/v3/public_section/contest_list?page=${page}`;
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(503).json({
                success: false,
                message: "Could not load Data"
            });
        }

        const data = await response.json();

        if (!data.data || !data.data.events) {
            break;
        }

        const events = data.data.events;

        for (let i = 0; i < events.length; i++) {
            const c = events[i];
            const start_time = new Date(c.event_start_time * 1000).getTime(); 
            const end_time = new Date(c.event_end_time * 1000).getTime(); 

            if (!req.query.parse_full_list && start_time < now) {
                limit -= 1;
                if (limit === 0) {
                    stop = true;
                    break;
                }
            }

            let status;
            if (now < start_time) {
                status = "upcoming";
            } else if (now >= start_time && now <= end_time) {
                status = "ongoing";
            } else {
                continue; 
            }

            jsonArray.push({
                name: c.name,
                start_time: start_time,
                end_time: end_time,
                status: status
            });
        }

        if (page >= data.data.total_pages) {
            break;
        }
    }
    res.status(200).json(jsonArray);
};

  
module.exports = { atCoderSchedule, codechefSchedule, codeforcesSchedule, hackerRankSchedule, hackerEarthSchedule ,leetCodeSchedule, gfgSchedule, codingNinjasSchedule }