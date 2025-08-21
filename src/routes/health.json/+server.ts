import { doHealthcheckSync } from "$lib/healthcheck";

export async function GET() {
  const status = await doHealthcheckSync();
  return new Response(JSON.stringify(status), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
