"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const apifyClient_1 = require("../api/apifyClient");
const dbClient_1 = require("../db/dbClient");
const main = async (event, context) => {
    console.log("[callProfileScrapingActor] SQS 이벤트 수신");
    // 1️⃣ SQS 메시지에서 타겟 데이터 추출
    const targets = event.Records.map((record) => {
        const body = JSON.parse(record.body);
        return { id: body.id, channelName: body.channelName };
    }).filter((cc) => cc.channelName);
    if (targets.length === 0) {
        console.log("[프로필데이터수집] channel username is empty");
        return;
    }
    console.log(`[프로필데이터수집] 수집 대상: ${JSON.stringify(targets)}`);
    const channelUsernames = targets.map((cc) => cc.channelName);
    // 2️⃣ Apify Run Actor 실행
    try {
        console.log("[프로필데이터수집] Apify Actor 실행 요청 시작");
        const apifyRunActorResponse = await (0, apifyClient_1.runActor)(channelUsernames);
        if (!apifyRunActorResponse.data?.id) {
            console.error("[프로필데이터수집] Apify Run Actor 실패");
            throw new Error("Apify Run Actor 실패");
        }
        const actorRunId = apifyRunActorResponse.data.id;
        const datasetId = apifyRunActorResponse.data.defaultDatasetId;
        console.log(`[프로필데이터수집][Apify] Actor Run ID: ${actorRunId}, Dataset ID: ${datasetId}`);
        // 3️⃣ PostgreSQL RDS에 저장
        const insertQuery = `
        INSERT INTO scraping_actor_log (actor_run_id, dataset_id, target_ids, type, created_at, date, status)
        VALUES ($1, $2, $3::jsonb, $4, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul', 'READY')
        `;
        const targetIdsArray = targets.map(cc => Number(cc.id)); // ✅ 숫자로 변환
        await (dbClient_1.query)(insertQuery, [actorRunId, datasetId, JSON.stringify(targetIdsArray), "PROFILE"]);
        console.log("[프로필데이터수집] PostgreSQL 로그 저장 완료");
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`[프로필데이터수집] ScrapingFailedException: ${error.message}`);
        }
        else {
            console.error(`[프로필데이터수집] ScrapingFailedException: 알 수 없는 오류 발생`, error);
        }
    }
};
exports.main = main;
