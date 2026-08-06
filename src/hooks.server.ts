import { readSettings } from "$lib/settings";
import { init } from "./manager";

init(readSettings());
