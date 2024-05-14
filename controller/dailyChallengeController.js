const fetch=require('node-fetch');


const leetCodeUrl='https://leetcode.com/graphql';

const leetcode_query = `
    query questionOfToday {
        activeDailyCodingChallengeQuestion {
            date
            userStatus
            link
            question {
                acRate
                difficulty
                freqBar
                frontendQuestionId: questionFrontendId
                isFavor
                paidOnly: isPaidOnly
                status
                title
                titleSlug
                hasVideoSolution
                hasSolution
                topicTags {
                    name
                    id
                    slug
                }
            }
        }
    }`;

const leetcodeDailyChallenge = async (req, res) => {

    const init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: leetcode_query }),
    };

    try {
        const response = await fetch(leetCodeUrl, init);
        res.status(200).json(response);
    } catch (error) {
        res.status(503).json({
            success: false,
            message:"Sorry! We are not avaiable now"
        })
    }
};


module.exports = leetcodeDailyChallenge;
