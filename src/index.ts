import { App, AppInfo, AppSlide, SlideMaker } from "tickerowl-app-base";

const CACHE_DURATION = 3 * 60 * 1000;
const CACHE_KEY = "cache";

export default class ProductHuntApp implements App {
  getInfo(): AppInfo {
    return {
      id: "producthunt",
      name: "Product Hunt",
      description: "Show your Product Hunt stats",
      version: 1,
      author: "Pramod",
      authorXUrl: "https://twitter.com/@pramodk73",
      authorGitHubUrl: "https://github.com/pskd73",
    };
  }

  getSlides(): Record<string, AppSlide> {
    return {
      "producthunt-stats": {
        title: "Product Hunt Stats",
        description: "Shows your Product Hunt stats",
        inputs: {
          "api-token": {
            type: "text",
            label: "API Token",
            required: true,
            placeholder: "Enter your Product Hunt API token",
          },
          slug: {
            type: "text",
            label: "Slug",
            required: true,
            placeholder: "Enter the slug of the post/launch",
          },
        },
        getData: async ({ inputs, store }) => {
          const apiToken = inputs["api-token"];
          const slug = inputs["slug"];

          if (!apiToken.value.value || !slug.value.value) {
            return {
              slides: [],
            };
          }

          let post: any = null;
          let rank: number | null = null;
          let lastRank;
          let lastVotes;
          let lastComments;

          let cachedRank;
          let cachedVotes;
          let cachedComments;

          let updatedAt;

          const cached = await store.read(CACHE_KEY);

          if (cached) {
            const cachedJson = JSON.parse(cached);
            lastRank = cachedJson.lastRank;
            lastVotes = cachedJson.lastVotes;
            lastComments = cachedJson.lastComments;
            cachedRank = cachedJson.rank;
            cachedVotes = cachedJson.votes;
            cachedComments = cachedJson.comments;
            updatedAt = cachedJson.updatedAt;
            if (
              cachedJson.slug === slug.value.value &&
              new Date(cachedJson.updatedAt) >
                new Date(Date.now() - CACHE_DURATION)
            ) {
              post = cachedJson.post;
              rank = cachedJson.rank;
            }
          }

          if (!post || rank === null) {
            const res = await this.getPostRank(
              slug.value.value.toString(),
              apiToken.value.value.toString()
            );
            post = res.post;
            rank = res.rank;
            updatedAt = Date.now();
          }

          const currentRank = rank;
          const currentVotes = post.votesCount;
          const currentComments = post.commentsCount;

          await store.write(
            CACHE_KEY,
            JSON.stringify({
              slug: slug.value.value.toString(),
              updatedAt,
              post,
              rank,
              lastRank: cachedRank !== currentRank ? cachedRank : lastRank,
              lastVotes: cachedVotes !== currentVotes ? cachedVotes : lastVotes,
              lastComments:
                cachedComments !== currentComments
                  ? cachedComments
                  : lastComments,
            })
          );

          return {
            slides: [
              SlideMaker.text({ text: `${post.name} - ${post.tagline}` }),
              SlideMaker.keyValue({
                key: "Rank",
                value: this.getNumberWithChange(currentRank, lastRank),
              }),
              SlideMaker.keyValue({
                key: "Votes",
                value: this.getNumberWithChange(currentVotes, lastVotes),
              }),
              SlideMaker.keyValue({
                key: "Comments",
                value: this.getNumberWithChange(currentComments, lastComments),
              }),
            ],
          };
        },
      },
    };
  }

  async getPostRank(
    slug: string,
    apiToken: string
  ): Promise<{ post: any; rank: number }> {
    const postRes = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        query: `{
          post(slug:"${slug}") {
            votesCount,
            name,
            featuredAt,
            commentsCount,
            tagline,
          }
        }`,
      }),
      cache: "no-store",
    });

    const post = await postRes.json();

    const date = post.data.post.featuredAt.split("T")[0];

    const postsRes = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        query: `{
          posts(featured:true, postedAfter:"${date}T00:00:00Z", postedBefore:"${date}T23:59:59Z") {
            nodes {
              slug
            }
          }
        }`,
      }),
    });
    const posts = await postsRes.json();
    const ranks = posts.data.posts.nodes.map(
      (node: { slug: string }) => node.slug
    ) as string[];
    const rank = ranks.indexOf(slug) + 1;

    return { post: post.data.post, rank };
  }

  getNumberWithChange(current: number, last: number): string {
    let change = "";
    if (last < current) {
      change = "🔼";
    } else if (last > current) {
      change = "🔽";
    }

    return `${change}${current}`;
  }
}
