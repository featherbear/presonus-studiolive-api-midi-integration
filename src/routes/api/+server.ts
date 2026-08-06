import { ScalarApiReference } from "@scalar/sveltekit";
import { openApiDocument } from "$lib/rpc/openapi";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) => {
  if (url.searchParams.get("format") === "json") {
    return new Response(JSON.stringify(openApiDocument), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return ScalarApiReference({
    url: "/api?format=json",
    hideClientButton: true,
    hideTestRequestButton: true,
    servers: [{ url: `${url.origin}/api` }],
    // defaultHttpClient: {
    //   targetKey: "js",
    //   clientKey: "fetch"
    // }
  })();
};
