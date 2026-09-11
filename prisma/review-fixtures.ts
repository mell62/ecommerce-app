export type ReviewFixture = Readonly<{
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}>;

const reviewerNames = [
  "Sherlock",
  "Watson",
  "Irene",
  "Mycroft",
  "Lestrade",
  "Hudson",
  "Moriarty",
  "Mary",
  "Gregson",
  "Hopkins",
  "Wiggins",
  "Moran",
  "Kitty",
  "Violet",
  "Billy",
  "Stamford",
  "Bradstreet",
  "Baynes",
] as const;

function datedReviews(
  reviews: readonly Omit<ReviewFixture, "name" | "createdAt">[],
  reviewerOffset: number
): ReviewFixture[] {
  return reviews.map((review, index) => ({
    ...review,
    name: reviewerNames[(index + reviewerOffset) % reviewerNames.length],
    createdAt: new Date(Date.UTC(2026, 7, 10 + index, 12)),
  }));
}

export const reviewFixturesByProductName: Readonly<
  Record<string, readonly ReviewFixture[]>
> = {
  "Mechanical Keyboard": datedReviews(
    [
      {
        rating: 5,
        comment:
          "The switches feel crisp and make long typing sessions enjoyable.",
      },
      {
        rating: 5,
        comment:
          "Comfortable spacing, quick response, and a reassuringly solid frame.",
      },
      {
        rating: 5,
        comment:
          "The RGB looks tasteful at lower brightness and is easy to adjust.",
      },
      {
        rating: 5,
        comment: "Very little deck flex, even when I type quickly.",
      },
      {
        rating: 4,
        comment: "The keycaps feel good and the legends remain clear at night.",
      },
      {
        rating: 4,
        comment: "It stays firmly in place and has been easy to keep clean.",
      },
      {
        rating: 3,
        comment:
          "The blue switches are more audible than I expected in a shared room.",
      },
      {
        rating: 5,
        comment:
          "Typing feels accurate and I noticed fewer missed keystrokes immediately.",
      },
      {
        rating: 5,
        comment:
          "A sturdy everyday keyboard with consistent feedback across the keys.",
      },
      {
        rating: 5,
        comment:
          "Inputs register instantly in games and the layout required no adjustment.",
      },
      {
        rating: 4,
        comment: "The lighting is even and the controls are straightforward.",
      },
      {
        rating: 2,
        comment: "The lighting software occasionally forgot my saved profile.",
      },
      {
        rating: 5,
        comment:
          "Excellent value for the typing feel and overall build quality.",
      },
      {
        rating: 3,
        comment:
          "I would have preferred an included wrist rest for longer sessions.",
      },
      {
        rating: 4,
        comment: "The feet are stable and the typing angle works well for me.",
      },
      {
        rating: 4,
        comment:
          "The switch feel is consistent from the letter keys to the larger keys.",
      },
    ],
    0
  ),
  "Gaming Mouse": datedReviews(
    [
      {
        rating: 5,
        comment: "Tracking feels precise and dependable during fast movements.",
      },
      {
        rating: 5,
        comment:
          "Wireless response feels immediate and I have not noticed any dropouts.",
      },
      {
        rating: 4,
        comment:
          "The shape is comfortable for work and evening gaming sessions.",
      },
      {
        rating: 5,
        comment: "Battery life has been excellent with my usual daily use.",
      },
      {
        rating: 4,
        comment:
          "The scroll wheel has defined steps without feeling overly stiff.",
      },
      {
        rating: 4,
        comment:
          "The side buttons are easy to reach and feel pleasantly tactile.",
      },
      {
        rating: 3,
        comment:
          "It feels slightly narrow in my larger hands after several hours.",
      },
      {
        rating: 5,
        comment:
          "Light enough for quick movement without feeling cheaply made.",
      },
      {
        rating: 4,
        comment: "Changing DPI is simple and each setting tracks consistently.",
      },
      {
        rating: 2,
        comment:
          "I sometimes press a side button accidentally when gripping it firmly.",
      },
      {
        rating: 5,
        comment:
          "It wakes quickly and reconnects without interrupting my workflow.",
      },
      {
        rating: 4,
        comment:
          "The finish feels smooth, although it shows fingerprints fairly easily.",
      },
      {
        rating: 3,
        comment:
          "The scroll click is louder than the other buttons in a quiet room.",
      },
      {
        rating: 4,
        comment: "A responsive and comfortable mouse for the discounted price.",
      },
    ],
    5
  ),
  "27-inch Monitor": datedReviews(
    [
      {
        rating: 5,
        comment:
          "Motion looks exceptionally smooth at 144Hz, especially in fast games.",
      },
      {
        rating: 4,
        comment:
          "Colors look lively without appearing exaggerated after a small adjustment.",
      },
      {
        rating: 5,
        comment: "The 27-inch size gives me ample room for work and gaming.",
      },
      {
        rating: 4,
        comment: "The image remains clear when viewed slightly off-center.",
      },
      {
        rating: 5,
        comment:
          "The high refresh rate is a noticeable upgrade from my older display.",
      },
      {
        rating: 4,
        comment:
          "The stand feels stable and the screen does not wobble while typing.",
      },
      {
        rating: 3,
        comment: "I wish the stand offered a wider range of height adjustment.",
      },
      {
        rating: 5,
        comment:
          "Text is sharp and comfortable to read throughout the workday.",
      },
      {
        rating: 4,
        comment:
          "The IPS panel gives the screen a clean and consistent appearance.",
      },
      {
        rating: 2,
        comment: "My unit has noticeable backlight glow in very dark scenes.",
      },
      {
        rating: 5,
        comment:
          "Switching between my work computer and console has been reliable.",
      },
      {
        rating: 4,
        comment: "The slim bezels make a dual-monitor setup look uncluttered.",
      },
      {
        rating: 4,
        comment:
          "The factory color settings needed some calibration before looking right.",
      },
      {
        rating: 5,
        comment: "Strong picture quality and smooth motion for the sale price.",
      },
      {
        rating: 4,
        comment: "Brightness is sufficient for my well-lit home office.",
      },
      {
        rating: 3,
        comment: "The on-screen controls take a little time to learn.",
      },
      {
        rating: 5,
        comment:
          "Games feel responsive and detailed without requiring an elaborate setup.",
      },
    ],
    11
  ),
};
