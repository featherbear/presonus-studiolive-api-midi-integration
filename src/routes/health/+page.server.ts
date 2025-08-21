import { doHealthcheck } from "$lib/healthcheck";

export function load({ params }) {
  return { ...doHealthcheck() };
}
