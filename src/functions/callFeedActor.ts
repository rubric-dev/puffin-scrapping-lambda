import { SQSEvent, Context } from "aws-lambda";
import { runActor } from "../api/apifyClient";
import { query } from "../db/dbClient";

interface Target {
  feedKey: string;
}

interface ApifyRunActorResponse {
  data?: {
    id: string;
    defaultDatasetId: string;
  };
}

export const main = async (event: SQSEvent, context: Context) => {
  console.log("[callFeedScrapingActor] SQS 이벤트 수신");
  console.log("📌 SQS 이벤트 전체 로그:", JSON.stringify(event, null, 2)); // ✅ 전체 이벤트 로그 찍기

  // 1️⃣ SQS 메시지에서 타겟 데이터 추출
  const targets: Target[] = event.Records.map((record) => {
    const body = JSON.parse(record.body);
    return { feedKey: body.feedKey };
  }).filter((cc) => cc.feedKey);

  if (targets.length === 0) {
    console.log("[피드데이터수집] feed data is empty");
    return;
  }

  console.log(`[피드데이터수집] 수집 대상: ${JSON.stringify(targets)}`);

  const feedKeys = targets.map((cc) => cc.feedKey); // ["DEY2T-oy4NJ", "DBGnGlYhUBa"]

  // 2️⃣ Apify Run Actor 실행
  try {
    console.log("[피드데이터수집] Apify Actor 실행 요청 시작");
    const apifyRunActorResponse: ApifyRunActorResponse = await runActor(feedKeys);

    if (!apifyRunActorResponse.data?.id) {
      console.error("[피드데이터수집] Apify Run Actor 실패");
      throw new Error("Apify Run Actor 실패");
    }

    const actorRunId = apifyRunActorResponse.data.id;
    const datasetId = apifyRunActorResponse.data.defaultDatasetId;
    console.log(`[피드데이터수집][Apify] Actor Run ID: ${actorRunId}, Dataset ID: ${datasetId}`);

    // 3️⃣ PostgreSQL RDS에 저장
    const insertQuery = `
      INSERT INTO scraping_actor_log (actor_run_id, dataset_id, target_ids, type, created_at, date, status)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul', 'READY')
    `;

    // 🔹 PostgreSQL target_ids 저장 방식 확인 후 적용
    // JSON 타입 컬럼이라면 JSON.stringify 사용
    // TEXT 타입 컬럼이라면 .join(",") 사용
    const targetIds = JSON.stringify(feedKeys); // ["DEY2T-oy4NJ", "DBGnGlYhUBa"]
    console.log(`[디버깅] targetIds: ${targetIds}`);


    await query(insertQuery, [actorRunId, datasetId, targetIds, "FEED"]);

    console.log("[피드데이터수집] PostgreSQL 로그 저장 완료");
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[피드데이터수집] ScrapingFailedException: ${error.message}`);
    } else {
      console.error(`[피드데이터수집] ScrapingFailedException: 알 수 없는 오류 발생`, error);
    }
  }
};
