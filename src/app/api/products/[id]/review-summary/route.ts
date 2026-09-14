import {
  getProductReviewSummary,
  ReviewSummaryProductNotFoundError,
} from "@/lib/review-summary-cache";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientAddress } from "@/lib/request-client";

export const runtime = "nodejs";

const REVIEW_SUMMARY_LIMIT = 20;
const REVIEW_SUMMARY_WINDOW_MS = 60 * 1000;

type ReviewSummaryRouteContext = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export async function GET(
  request: Request,
  { params }: ReviewSummaryRouteContext
): Promise<Response> {
  try {
    const productId = (await params).id.trim();

    if (!productId) {
      return Response.json(
        { error: "Product ID is required." },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const rateLimit = await consumeRateLimit({
      namespace: "ai:review-summary",
      identifier: getClientAddress(request),
      limit: REVIEW_SUMMARY_LIMIT,
      windowMs: REVIEW_SUMMARY_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Too many review summary requests. Try again shortly." },
        {
          status: 429,
          headers: {
            ...noStoreHeaders,
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const result = await getProductReviewSummary(productId);

    if (result.status === "not-enough-reviews") {
      return Response.json(result, { headers: noStoreHeaders });
    }

    return Response.json(
      {
        status: result.status,
        summary: result.content,
        reviewCount: result.reviewCount,
        generatedAt: result.generatedAt.toISOString(),
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    if (error instanceof ReviewSummaryProductNotFoundError) {
      return Response.json(
        { error: "Product not found." },
        { status: 404, headers: noStoreHeaders }
      );
    }

    console.error("Failed to load product review summary:", error);

    return Response.json(
      { error: "Review summary is temporarily unavailable." },
      { status: 503, headers: noStoreHeaders }
    );
  }
}
