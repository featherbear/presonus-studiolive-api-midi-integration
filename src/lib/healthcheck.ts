import {
  consoleConnectionManager,
  midiConnectionManager,
  deviceControllerManager,
} from "../manager";

type EntryType = {
  title: string;
  description?: string;
  result: ResultType | Promise<ResultType>;
};
type ResultType = { status: boolean; message?: string; data?: any };

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function withState<T extends Record<string, any>>(
  data: Record<string, T>,
  getState: (item: T) => string,
) {
  return Object.fromEntries(
    Object.entries(data).map(([key, item]) => [
      key,
      {
        ...item,
        state: getState(item),
      },
    ]),
  );
}

function isHealthyState(state: unknown) {
  return state === "connected" || state === "registered";
}

function getMapHealth(data: unknown) {
  if (!data || typeof data !== "object") return true;

  return Object.values(data).every((item) => {
    if (!item || typeof item !== "object" || !("state" in item)) return false;
    return isHealthyState((item as { state: unknown }).state);
  });
}

function wrapPromise<T>(
  promise: () => Promise<T>,
  getStatus: (data: T) => boolean = () => true,
): Promise<ResultType> {
  return promise()
    .then((data) => {
      const response: ResultType = {
        status: getStatus(data),
      };

      if (data) {
        // Ensure the data is serializable by doing a deep copy via JSON
        response.data = serialize(data);
      }

      return response;
    })
    .catch((e) => ({
      status: false,
      message: e instanceof Error ? e.message : "Unknown error",
    }));
}

export function doHealthcheck() {
  const status: Record<string, EntryType> = {
    web: {
      title: "Web Server",
      description: "Health of the web server",
      result: wrapPromise(async () => {
        return;
      }),
    },
    consoles: {
      title: "PreSonus Mixers",
      description: "Connections to the StudioLive Series III console",
      result: wrapPromise(async () => {
        const data = serialize(consoleConnectionManager.connections);
        return withState(data, (item) => item.state ?? "unknown");
      }, getMapHealth),
    },
    midi: {
      title: "MIDI Devices",
      description: "Connections to MIDI devices",
      result: wrapPromise(async () => {
        const data = serialize(midiConnectionManager.connections);
        return withState(data, (item) =>
          item.connected ? "connected" : "disconnected",
        );
      }, getMapHealth),
    },
    controllers: {
      title: "Device Controllers",
      description: "Controllers",
      result: wrapPromise(async () => {
        const data = serialize(deviceControllerManager.connections);
        return withState(data, () => "registered");
      }, getMapHealth),
    },
  };

  return status;
}

export async function doHealthcheckSync() {
  const result = {} as Record<
    string,
    Omit<EntryType, "result"> & { result: ResultType }
  >;
  for (const [key, entry] of Object.entries(doHealthcheck())) {
    result[key] = { ...entry, result: await entry.result };
  }
  return result;
}
