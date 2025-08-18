import type { RequestHandler } from "@sveltejs/kit";

import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { router } from "$lib/rpc/impl";

const handler = new OpenAPIHandler(router, {});

export const fallback: RequestHandler = async (event) => {
  const { response, ...rest } = await handler.handle(event.request, {
    prefix: "/api",
    context: {},
  });

  return response ?? new Response("Not Found", { status: 404 });
};
