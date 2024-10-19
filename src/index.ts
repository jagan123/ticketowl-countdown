import { App, AppInfo, AppSlide } from "tickerowl-app-base";

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
          "slug": {
            type: "text",
            label: "Slug",
            required: true,
            placeholder: "Enter the slug of the post/launch",
          },
        },
        getData: async ({ inputs }) => {
          const apiToken = inputs["api-token"];
          const slug = inputs["slug"];

          console.log(apiToken, slug);

          if (!apiToken.value.value || !slug.value.value) {
            return {
              slides: [],
            };
          }

          const { post, rank } = await this.getPostRank(
            slug.value.value.toString(),
            apiToken.value.value.toString()
          );

          return {
            slides: [
              {
                type: "TEXT",
                text: `${post.name} - ${post.tagline}`,
              },
              {
                type: "KEY_VALUE",
                key: "Rank",
                value: rank.toString(),
              },
              {
                type: "KEY_VALUE",
                key: "V/C",
                value: `${post.votesCount}/${post.commentsCount}`,
              },
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
            description,
            votesCount,
            name,
            featuredAt,
            commentsCount,
            tagline,
            website,
            reviewsCount,
            reviewsRating
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
}
