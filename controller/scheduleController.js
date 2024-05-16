const axios = require('axios')
const cheerio = require('cheerio')
const pretty = require('pretty')
const fetch=require('node-fetch')
const puppeteer = require('puppeteer')

const atCoderUrl = "https://atcoder.jp/contests"
const codeChefUrl = "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all"
const codeforcesUrl="https://codeforces.com/api/contest.list?"
const hackerRankUrl = "https://www.hackerrank.com/rest/contests/upcoming?limit=100"
const hackerEarthUrl = "https://www.hackerearth.com/chrome-extension/events/"
const kickStartUrl = "https://codingcompetitions.withgoogle.com/kickstart/schedule"
const leetCodeUrl="https://leetcode.com/graphql?query={%20allContests%20{%20title%20titleSlug%20startTime%20duration%20__typename%20}%20}"
const gfgUrl="https://practice.geeksforgeeks.org/events?utm_source=geeksforgeeks&utm_medium=topheader&utm_campaign=inbound_promotions"


const atCoderSchedule = async (req, res) => {
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
                    const contestStartUTC = Date.parse(curr.contest_start_date_iso);
                    const contestEndUTC = Date.parse(curr.contest_end_date_iso)
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

module.exports = { atCoderSchedule, codechefSchedule, codeforcesSchedule, hackerRankSchedule, hackerEarthSchedule   ,leetCodeSchedule }