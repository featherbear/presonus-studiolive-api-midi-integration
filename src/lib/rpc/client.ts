import type { JsonifiedClient } from "@orpc/openapi-client";
import type { ContractRouterClient } from "@orpc/contract";
import { createORPCClient, onError } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { contract } from "./contract";
import _logger from "$lib/logger";

const logger = _logger.child({ module: "rpcClient" });

const link = new OpenAPILink(contract, {  
  url: `${location.origin}/api`,
  interceptors: [
    onError((error) => {
      logger.error({ error }, "RPC request failed");
    }),
  ],
});

export const client: JsonifiedClient<ContractRouterClient<typeof contract>> =
  createORPCClient(link);
