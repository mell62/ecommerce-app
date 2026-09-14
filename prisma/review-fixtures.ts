import { catalogProductFixtures } from "./catalog-fixtures.ts";

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

function createComment(
  rating: number,
  strength: string,
  concern: string,
  index: number
): string {
  const positive = [
    `What stood out most is that ${strength}. It feels carefully considered.`,
    `After several weeks, ${strength}. I am very pleased with it.`,
    `For my everyday setup, ${strength}. It has been consistently dependable.`,
    `The best part is how ${strength}. That makes it easy to recommend.`,
  ];
  const balanced = [
    `I like that ${strength}, although ${concern}.`,
    `Overall, ${strength}. My main reservation is that ${concern}.`,
    `In regular use, ${strength}, but ${concern}.`,
  ];
  const critical = [
    `The biggest issue is that ${concern}. That compromise is difficult to ignore.`,
    `I wanted to like it, but ${concern}. It does not suit my daily setup.`,
    `Unfortunately, ${concern}. I would wait for a revised version.`,
  ];

  if (rating === 5) return positive[index % positive.length];
  if (rating >= 3) return balanced[index % balanced.length];
  return critical[index % critical.length];
}

export const reviewFixturesByProductName: Readonly<
  Record<string, readonly ReviewFixture[]>
> = Object.fromEntries(
  catalogProductFixtures.map((product, productIndex) => [
    product.name,
    product.ratings.map((rating, reviewIndex) => {
      const strength =
        product.strengths[
          (reviewIndex * 3 + productIndex) % product.strengths.length
        ];
      const concern =
        product.concerns[
          (reviewIndex * 2 + productIndex) % product.concerns.length
        ];

      return {
        name: reviewerNames[
          (reviewIndex + productIndex * 5) % reviewerNames.length
        ],
        rating,
        comment: createComment(rating, strength, concern, reviewIndex),
        createdAt: new Date(
          Date.UTC(
            2026,
            7,
            1 + productIndex,
            12 + (reviewIndex % 10),
            reviewIndex
          )
        ),
      };
    }),
  ])
);
