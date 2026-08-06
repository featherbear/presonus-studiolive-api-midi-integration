import { doHealthcheck } from "$lib/healthcheck";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => {
  return { ...doHealthcheck() };
};
