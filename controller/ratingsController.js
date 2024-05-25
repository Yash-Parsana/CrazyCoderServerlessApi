const axios = require('axios');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const pretty = require('pretty');
const { request, gql } = require('graphql-request');

const atcoderBaseUrl = 'https://atcoder.jp/users/';
const codeChefBaseUrl = 'https://www.codechef.com/users/';
const codeforcesBaseUrl = 'https://codeforces.com/api/user.info?handles=';
const leetCodeBaseUrl = 'https://leetcode.com/graphql';

const atCoderRating = async (req, res) => {
    try {
        const url = atcoderBaseUrl + req.params.username;
        const { data } = await axios.get(url);

        const $ = cheerio.load(data);

        const rt = $('.mt-2 tbody tr:nth-child(2) td span');
        const rating = pretty(rt.html());
        res.status(200).json({
            status: 'success',
            handle: req.params.username,
            rating: rating,
        });
    } catch (err) {
        console.log('Error while Fetching atcoderRating -> ', err);
        res.status(503).json({
            success: false,
            message: 'Opps! Some error occurred',
        });
    }
};

const codechefRating = async (req, res) => {
    const username = req.params.username;
    try {
        const url = codeChefBaseUrl + username;
        const { data } = await axios.get(url);

        const $ = cheerio.load(data);
        const ratingDiv = $('.user-profile-container .row .sidebar .content .rating-header .rating-number');
        const stars = $('.user-profile-container .row .sidebar .content .rating-header .rating-star');
        const rating = parseInt(pretty(ratingDiv.html()));
        let star = 1;
        if (rating >= 1400 && rating < 1600) {
            star = 2;
        } else if (rating >= 1600 && rating < 1800) {
            star = 3;
        } else if (rating >= 1800 && rating < 2000) {
            star = 4;
        } else if (rating >= 2000 && rating < 2200) {
            star = 5;
        } else if (rating >= 2200 && rating < 2500) {
            star = 6;
        } else if (rating >= 2500) {
            star = 7;
        }
        res.status(200).json({
            status: 'success',
            handle: username,
            rating: rating,
            stars: star,
        });
    } catch (err) {
        console.log('Error in codechef Rating Fun -> ', err);
        res.status(503).json({
            success: false,
            message: 'Opps! Some error occurred',
        });
    }
};

const codeforcesRating = async (req, res) => {
    const users = req.params.users;
    const url = codeforcesBaseUrl + users;
    const response = await fetch(url, { method: 'GET' });

    try {
        const jsonArray = [];
        if (response.ok) {
            const jsonObject = await response.json();
            if (jsonObject.status == 'OK') {
                const arr = jsonObject.result;

                for (let i = 0; i < arr.length; i++) {
                    const curr = arr[i];
                    const obj = {
                        handle: curr.handle,
                        rating: curr.rating,
                        rank: curr.rank,
                        maxRating: curr.maxRating,
                        maxRank: curr.maxRank,
                    };
                    jsonArray.push(obj);
                }
            }
            res.status(200).send(jsonArray);
        } else {
            console.log('Error in fetching codeforces ratings -> ', response.error);
            res.status(503).json({
                success: false,
                message: 'Opps! Some error occurred',
            });
        }
    } catch (err) {
        console.log('Error in codeforces Rating Fun -> ', err);
        res.status(503).json({
            status: 'failed',
            message: 'Opps! Some error occurred',
        });
    }
};

const leetCodeRating = async (req, res) => {
    const username = req.params.username;
    try {
        const query = gql`
            query getUserProfile($username: String!) {
                userContestRanking(username: $username) {
                    rating
                }
                matchedUser(username: $username) {
                    username
                    submitStats: submitStatsGlobal {
                        acSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                    }
                }
            }
        `;
        const variables = { username };
        const data = await request(leetCodeBaseUrl, query, variables);
        const rating = Math.floor((data?.userContestRanking?.rating));
        const solvedQuestions = {}
        data?.matchedUser?.submitStats?.acSubmissionNum.forEach(element => {
            solvedQuestions[(element?.difficulty)?.toLowerCase()] = element.count;
        });
        res.status(200).json({
            status: 'success',
            handle: username,
            rating: rating,
            ...solvedQuestions
        });
    } catch (err) {
        console.log('Error in leetCode Rating Fun -> ', err);
        res.status(503).json({
            status: 'failed',
            message: 'Opps! Some error occurred',
        });
    }
};

const GeeksForGeeksProfile = async (req, res) => {
    const username = req.params.username;
    const BASE_URL = `https://auth.geeksforgeeks.org/user/${username}/practice/`;

    try {
        const profilePage = await axios.get(BASE_URL);

        if (profilePage.status !== 200) {
            return res.status(503).json({
                status: 'failure',
                message: 'Profile Not Found'
            });
        }

        const $ = cheerio.load(profilePage.data);

        const additionalDetails = extractDetails($);
        const codingScores = additionalDetails.coding_scores;

        const response = {
            status: "success",
            handle: username,
            over_all_coding_score: parseInt(codingScores.codingScore || 0, 10),
            total_problem_solved: parseInt(codingScores.totalProblemsSolved || 0, 10),
            monthly_coding_score: parseInt(codingScores.monthlyCodingScore || 0, 10),
            over_all_article_published: parseInt(codingScores.articlesPublished || 0, 10)
        };

        res.status(200).send(response);
    } catch (error) {
        console.log('Error fetching GeeksForGeeks profile ->', error);
        res.status(503).json({
            status: 'failed',
            message: 'Oops! Some error occurred'
        });
    }
};

const extractTextFromElements = ($, elements, elementKeys) => {
    const result = {};
    elements.each((index, element) => {
        const innerText = $(element).text().trim();
        result[elementKeys[index]] = innerText === '_ _' ? "" : innerText;
    });
    return result;
};

const extractDetails = ($) => {
    const codingScoresByIndex = ["codingScore", "totalProblemsSolved", "monthlyCodingScore", "articlesPublished"];

    let codingScores = $("span.score_card_value");
    if (codingScores.length === 0) {
        codingScores = $("div:contains('Coding Score')").nextAll("span");
    }

    return {
        coding_scores: extractTextFromElements($, codingScores, codingScoresByIndex)
    };
};

module.exports = { atCoderRating, codechefRating, codeforcesRating, leetCodeRating, GeeksForGeeksProfile };
