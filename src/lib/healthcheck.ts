type EntryType = {
  title: string;
  description?: string;
  result: ResultType | Promise<ResultType>;
};
type ResultType = { status: boolean; message?: string };

function wrapPromise<T>(promise: () => Promise<T>): Promise<ResultType> {
  return promise()
    .then(() => ({
      status: true,
    }))
    .catch((e) => ({
      status: false,
      message: e instanceof Error ? e.message : "Unknown error",
    }));
}

export function doHealthcheck() {
  const status: Record<string, EntryType> = {
    WebServer: {
      title: "Web Server",
      description: "Health of the web server",
      result: wrapPromise(async () => {}),
    },
    Console: {
      title: "PreSonus Console",
      description: "Connection to the StudioLive Series III console",
      result: wrapPromise(async () => {}),
    },
    MIDI: {
      title: "MIDI Device",
      description: "Connection to the configured MIDI device",
      result: wrapPromise(async () => {}),
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
