const axios = require('axios');
const cheerio = require('cheerio');
const pretty = require('pretty');
const fetch = require('node-fetch');

const atCoderUrl = "https://atcoder.jp/contests";
const codeChefUrl = "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all";
const codeforcesUrl = "https://codeforces.com/api/contest.list?";
const hackerRankUrl = "https://www.hackerrank.com/rest/contests/upcoming?limit=100";
const hackerEarthUrl = "https://www.hackerearth.com/chrome-extension/events/";
const kickStartUrl = "https://codingcompetitions.withgoogle.com/kickstart/schedule";
const leetCodeUrl = "https://leetcode.com/graphql?query={ allContests { title titleSlug startTime duration __typename } }";

// Function to fetch AtCoder contests
const atCoderSchedule = async (req, res) => {
    try {
        const { data } = await axios.get(atCoderUrl);
        const $ = cheerio.load(data);
        const contests = $(".table-default tbody tr");
        const jsonArray = [];

        contests.each((idx, ele) => {
            const curr = cheerio.load(ele);
            const name = pretty(curr("td:nth-child(2) a").html());
            const startTime = parseInt(Date.parse(pretty(curr("td:nth-child(1) a time").html())));
            const durationStr = pretty(curr("td:nth-child(3)").html()).toString();
            const [hours, minutes] = durationStr.split(":").map(Number);
            const endTime = startTime + hours * 60 * 60 * 1000 + minutes * 60 * 1000;
            if (!isNaN(startTime) && !isNaN(endTime) && endTime > Date.now()) {
                const status = Date.now() > startTime ? "ongoing" : "upcoming";
                jsonArray.push({
                    name,
                    start_time: startTime,
                    end_time: endTime,
                    status
                });
            }
        });

        res.status(200).send(jsonArray);
    } catch (error) {
        console.error('Error fetching AtCoder contests:', error);
        res.status(503).json({
            success: false,
            message: "Oops! Some error occurred"
        });
    }
};

// Function to fetch CodeChef contests
const codechefSchedule = async (req, res) => {
    try {
        const response = await fetch(codeChefUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const { present_contests: presentContests, future_contests: futureContests } = data;
        const jsonArray = [];

        if (data.status === 'success') {
            presentContests.forEach(contest => {
                if (contest.contest_code !== 'GAMES') {
                    const startTime = Date.parse(contest.contest_start_date_iso);
                    const endTime = Date.parse(contest.contest_end_date_iso);
                    jsonArray.push({
                        name: contest.contest_name,
                        start_time: startTime,
                        end_time: endTime,
                        status: "ongoing"
                    });
                }
            });

            futureContests.forEach(contest => {
                const startTime = Date.parse(contest.contest_start_date_iso);
                const endTime = Date.parse(contest.contest_end_date_iso);
                jsonArray.push({
                    name: contest.contest_name,
                    start_time: startTime,
                    end_time: endTime,
                    status: "upcoming"
                });
            });

            res.status(200).send(jsonArray);
        } else {
            throw new Error('API response not successful');
        }
    } catch (error) {
        console.error('Error fetching CodeChef contests:', error);
        res.status(503).json({
            success: false,
            message: "Sorry! We are not available now"
        });
    }
};

// Function to fetch Codeforces contests
const codeforcesSchedule = async (req, res) => {
    try {
        const response = await fetch(codeforcesUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const { result: contests, status } = data;
        const jsonArray = [];

        if (status === 'OK') {
            contests.forEach(contest => {
                if (contest.phase === 'BEFORE' || contest.phase === 'CODING') {
                    const startTime = contest.startTimeSeconds * 1000;
                    const endTime = (contest.startTimeSeconds + contest.durationSeconds) * 1000;
                    const status = contest.phase === 'BEFORE' ? "upcoming" : "ongoing";
                    jsonArray.push({
                        name: contest.name,
                        start_time: startTime,
                        end_time: endTime,
                        status
                    });
                }
            });

            res.status(200).send(jsonArray);
        } else {
            throw new Error('API response not successful');
        }
    } catch (error) {
        console.error('Error fetching Codeforces contests:', error);
        res.status(503).json({
            success: false,
            message: "Can not load contests"
        });
    }
};

// Function to fetch HackerRank contests
const hackerRankSchedule = async (req, res) => {
    try {
        const response = await fetch(hackerRankUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const { models: contests } = data;
        const jsonArray = [];

        contests.forEach(contest => {
            if (!contest.ended) {
                const startTime = contest.epoch_starttime * 1000;
                const endTime = contest.epoch_endtime * 1000;
                const status = contest.started ? "ongoing" : "upcoming";
                jsonArray.push({
                    name: contest.name,
                    start_time: startTime,
                    end_time: endTime,
                    status
                });
            }
        });

        res.status(200).send(jsonArray);
    } catch (error) {
        console.error('Error fetching HackerRank contests:', error);
        res.status(503).json({
            success: false,
            message: "Can not load contests"
        });
    }
};

// Function to fetch HackerEarth contests
const hackerEarthSchedule = async (req, res) => {
    try {
        const response = await fetch(hackerEarthUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const { response: contests } = data;
        const jsonArray = [];

        contests.forEach(contest => {
            const startTime = Date.parse(contest.start_tz);
            const endTime = Date.parse(contest.end_tz);
            const status = contest.status.toLowerCase();
            jsonArray.push({
                name: contest.title,
                start_time: startTime,
                end_time: endTime,
                status
            });
        });

        res.status(200).send(jsonArray);
    } catch (error) {
        console.error('Error fetching HackerEarth contests:', error);
        res.status(503).json({
            success: false,
            message: "Can not load contests"
        });
    }
};

// Function to fetch LeetCode contests
const leetCodeSchedule = async (req, res) => {
    try {
        const response = await fetch(leetCodeUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const { data: { allContests: contests } } = data;
        const jsonArray = [];

        contests.forEach(contest => {
            const name = contest.title;
            const startTime = contest.startTime * 1000;
            const endTime = startTime + contest.duration * 1000;
            if (endTime > Date.now()) {
                const status = startTime < Date.now() ? "ongoing" : "upcoming";
                jsonArray.push({
                    name,
                    start_time: startTime,
                    end_time: endTime,
                    status
                });
            }
        });

        res.status(200).send(jsonArray);
    } catch (error) {
        console.error('Error fetching LeetCode contests:', error);
        res.status(503).json({
            success: false,
            message: "Could not load data"
        });
    }
};

// Function to fetch GeeksForGeeks contests
const gfgSchedule = async (req, res) => {
    try {
        const contests = [];
        let page = 1;

        while (true) {
            const gfgUrl = `https://practiceapi.geeksforgeeks.org/api/v1/events/?type=contest&page_number=${page}&sub_type=all`;
            const response = await axios.get(gfgUrl);
            const { results } = response.data;

            if (!results) break;

            const { upcoming, past } = results;
            const allContests = upcoming.concat(past);

            allContests.forEach(contest => {
                const startTime = new Date(contest.start_time).getTime();
                const endTime = new Date(contest.end_time).getTime();
                const now = Date.now();

                let status;
                if (now < startTime) {
                    status = "upcoming";
                } else if (now >= startTime && now <= endTime) {
                    status = "ongoing";
                } else {
                    return;
                }

                contests.push({
                    name: contest.name || contest.title,
                    start_time: startTime,
                    end_time: endTime,
                    status
                });
            });

            if (!req.query.parse_full_list) break;
            page += 1;
        }

        res.json(contests);
    } catch (error) {
        console.error('Error fetching GFG contests:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to fetch Coding Ninjas contests
const codingNinjasSchedule = async (req, res) => {
    try {
        let page = 0;
        let stop = false;
        let limit = 25;
        const jsonArray = [];
        const now = Date.now();

        while (!stop) {
            page += 1;
            const url = `https://api.codingninjas.com/api/v3/public_section/contest_list?page=${page}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const { events, total_pages: totalPages } = data.data;

            events.forEach(event => {
                const startTime = new Date(event.event_start_time * 1000).getTime();
                const endTime = new Date(event.event_end_time * 1000).getTime();

                if (!req.query.parse_full_list && startTime < now) {
                    limit -= 1;
                    if (limit === 0) {
                        stop = true;
                        return;
                    }
                }

                let status;
                if (now < startTime) {
                    status = "upcoming";
                } else if (now >= startTime && now <= endTime) {
                    status = "ongoing";
                } else {
                    return;
                }

                jsonArray.push({
                    name: event.name,
                    start_time: startTime,
                    end_time: endTime,
                    status
                });
            });

            if (page >= totalPages) break;
        }

        res.status(200).json(jsonArray);
    } catch (error) {
        console.error('Error fetching Coding Ninjas contests:', error);
        res.status(503).json({
            success: false,
            message: "Could not load data"
        });
    }
};

module.exports = {
    atCoderSchedule,
    codechefSchedule,
    codeforcesSchedule,
    hackerRankSchedule,
    hackerEarthSchedule,
    leetCodeSchedule,
    gfgSchedule,
    codingNinjasSchedule
};
