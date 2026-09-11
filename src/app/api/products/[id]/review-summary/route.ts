import {
  getProductReviewSummary,
  ReviewSummaryProductNotFoundError,
} from "@/lib/review-summary-cache";

export const runtime = "nodejs";

type ReviewSummaryRouteContext = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export async function GET(
  _request: Request,
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
