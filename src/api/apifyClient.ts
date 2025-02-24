import axios from "axios";
import * as dotenv from "dotenv";

// 로컬 환경 변수 로드
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const ACTOR_ID = "apify~instagram-profile-scraper";
const APIFY_BASE_URL = "https://api.apify.com/v2/acts";

export const runActor = async (channelUsernames: string[]) => {
  if (!channelUsernames || channelUsernames.length === 0) {
    console.log("[RUN APIFY ACTOR] channel username is null or empty");
    return {};
  }

  const request = { usernames: channelUsernames };

  try {
    const response = await axios.post(
      `${APIFY_BASE_URL}/${ACTOR_ID}/runs?token=${process.env.APIFY_TOKEN}`,
      request,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log(`[RUN APIFY ACTOR] response: ${JSON.stringify(response.data)}`);
    return response.data || {};
  } catch (error) {
    console.error("[RUN APIFY ACTOR] Error:", error);
    throw new Error("ApifyRequestFailedException");
  }
};
