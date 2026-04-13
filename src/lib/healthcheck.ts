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

function wrapPromise<T>(promise: () => Promise<T>): Promise<ResultType> {
  return promise()
    .then((data) => {
      const response: ResultType = {
        status: true,
      };

      console.log(data);

      if (data) {
        // Ensure the data is serializable by doing a deep copy via JSON
        response.data = JSON.parse(JSON.stringify(data));
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
        return true;
      }),
    },
    consoles: {
      title: "PreSonus Mixers",
      description: "Connections to the StudioLive Series III console",
      result: wrapPromise(async () => {
        return consoleConnectionManager.connections;
      }),
    },
    midi: {
      title: "MIDI Connections",
      description: "Connections to MIDI devices",
      result: wrapPromise(async () => {
        return midiConnectionManager.connections;
      }),
    },
    controllers: {
      title: "Device Controllers",
      description: "Controllers",
      result: wrapPromise(async () => {
        return deviceControllerManager.connections;
      }),
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
