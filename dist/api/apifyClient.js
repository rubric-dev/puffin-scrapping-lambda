"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runActor = void 0;
const axios_1 = require("axios");
const dotenv = require("dotenv");
// 로컬 환경 변수 로드
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}
const ACTOR_ID = "apify~instagram-profile-scraper";
const APIFY_BASE_URL = "https://api.apify.com/v2/acts";
const runActor = async (channelUsernames) => {
    if (!channelUsernames || channelUsernames.length === 0) {
        console.log("[RUN APIFY ACTOR] channel username is null or empty");
        return {};
    }
    const request = { usernames: channelUsernames };
    try {
        const response = await axios_1.default.post(`${APIFY_BASE_URL}/${ACTOR_ID}/runs?token=${process.env.APIFY_TOKEN}`, request, {
            headers: { "Content-Type": "application/json" },
        });
        console.log(`[RUN APIFY ACTOR] response: ${JSON.stringify(response.data)}`);
        return response.data || {};
    }
    catch (error) {
        console.error("[RUN APIFY ACTOR] Error:", error);
        throw new Error("ApifyRequestFailedException");
    }
};
exports.runActor = runActor;
