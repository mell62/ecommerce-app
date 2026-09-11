import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MIN_REVIEWS_FOR_SUMMARY,
  summarizeProductReviews,
} from "./review-summary";

vi.mock("server-only", () => ({}));

const originalApiKey = process.env.DEEPSEEK_API_KEY;
const originalModel = process.env.DEEPSEEK_MODEL;

const reviews = [
  { rating: 5, comment: "Fast, comfortable, and precise." },
  { rating: 4, comment: "Comfortable for long work sessions." },
];

describe("summarizeProductReviews", () => {
  beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = "test-deepseek-key";
    delete process.env.DEEPSEEK_MODEL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalApiKey === undefined) {
      delete process.env.DEEPSEEK_API_KEY;
    } else {
      process.env.DEEPSEEK_API_KEY = originalApiKey;
    }

    if (originalModel === undefined) {
      delete process.env.DEEPSEEK_MODEL;
    } else {
      process.env.DEEPSEEK_MODEL = originalModel;
    }
  });

  it("sends only ratings and comments to DeepSeek", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "Customers praise its comfort and precise tracking.",
              },
            },
          ],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const summary = await summarizeProductReviews("Zeus Wireless Mouse", reviews);

    expect(summary).toBe(
      "Customers praise its comfort and precise tracking."
    );
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));
    const reviewPayload = JSON.parse(body.messages[1].content);

    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(request.headers).toEqual({
      Authorization: "Bearer test-deepseek-key",
      "Content-Type": "application/json",
    });
    expect(body.model).toBe("deepseek-v4-flash");
    expect(body.thinking).toEqual({ type: "disabled" });
    expect(reviewPayload).toEqual({
      productName: "Zeus Wireless Mouse",
      reviews,
    });
  });

  it("supports an environment-configured model", async () => {
    process.env.DEEPSEEK_MODEL = "deepseek-v4-pro";
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [{ message: { content: "A balanced product summary." } }],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await summarizeProductReviews("Zeus Wireless Mouse", reviews);

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(request.body));

    expect(body.model).toBe("deepseek-v4-pro");
  });

  it("requires enough reviews before making an API request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      summarizeProductReviews(
        "Zeus Wireless Mouse",
        reviews.slice(0, MIN_REVIEWS_FOR_SUMMARY - 1)
      )
    ).rejects.toThrow("At least 2 reviews are required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a server-side API key", async () => {
    delete process.env.DEEPSEEK_API_KEY;

    await expect(
      summarizeProductReviews("Zeus Wireless Mouse", reviews)
    ).rejects.toThrow("DEEPSEEK_API_KEY is not configured");
  });

  it("rejects failed and empty DeepSeek responses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(Response.json({ choices: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      summarizeProductReviews("Zeus Wireless Mouse", reviews)
    ).rejects.toThrow("DeepSeek request failed with status 429");
    await expect(
      summarizeProductReviews("Zeus Wireless Mouse", reviews)
    ).rejects.toThrow("DeepSeek returned an empty review summary");
  });
});
