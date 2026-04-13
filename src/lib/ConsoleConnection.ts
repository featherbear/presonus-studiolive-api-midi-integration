import { nanoid } from "nanoid";
import { SimpleClient } from "@featherbear/presonus-studiolive-api/simple";
import { Discovery, type DiscoveryType } from "@featherbear/presonus-studiolive-api";

import {
  proxyEventRegistrationInterface,
  restoreEventRegistrations,
  type EventRegistrationPersistence,
} from "./EventRegistrationPersistence";
import type { ConsoleConnectionInterop } from "./types/ConsoleConnectionInterop";

type InitArgs = ConstructorParameters<typeof SimpleClient>;

const discoveryClient = new Discovery();
let discoveredConsoles: Record<string, DiscoveryType> = {};
discoveryClient.on("discover", (entry: DiscoveryType) => {
  if (!entry.serial) {
    console.warn("Dropping discovery of", entry, "no serial");
    return;
  }
  discoveredConsoles[entry.serial] = entry;
});
discoveryClient.start();

function getDiscoveredConsoles() {
  let now = new Date();
  return Object.values(discoveredConsoles)
    .filter((entry) => now.getTime() - entry.timestamp.getTime() < 10 * 1000)
    .sort((a, b) => a.serial.localeCompare(b.serial));
}

export class ConsoleConnectionManager {
  #connections: Record<string, ConsoleConnection>;
  constructor() {
    this.#connections = {};
  }

  static discover() {
    return getDiscoveredConsoles();
  }

  discover() {
    return getDiscoveredConsoles();
  }

  get(id: string) {
    return this.#connections[id];
  }

  private register(instance: ConsoleConnection) {
    this.#connections[instance.id] = instance;
    return instance;
  }

  addFromConfig(config: ConsoleConnectionInterop) {
    const instance = new ConsoleConnection(this, config.address);
    instance.id = config.id;
    return this.register(instance);
  }

  create(...args: InitArgs) {
    const instance = new ConsoleConnection(this, ...args);
    return this.register(instance);
  }

  get connections() {
    return this.#connections;
  }
}

export class ConsoleConnection {
  private context: {
    manager: ConsoleConnectionManager;
    initArgs: InitArgs;
  };
  id: string;
  name?: string;
  private listeners: EventRegistrationPersistence;
  client: SimpleClient;
  private _state: "connected" | "closed" | "error" | "reconnecting" | null;

  constructor(manager: ConsoleConnectionManager, ...args: InitArgs) {
    this.context = {
      manager,
      initArgs: args,
    };
    this.id = nanoid();
    this.listeners = {};
    this.client = this.createConsole(...args);

    this.client.on("connected", () => {
      this._state = "connected";
    });
    this.client.on("closed", () => {
      this._state = "closed";
    });
    this.client.on("error", () => {
      this._state = "error";
    });
    this.client.on("reconnecting", () => {
      this._state = "reconnecting";
    });

    this._state = null;
  }

  get state() {
    return this._state;
  }

  toJSON(): ConsoleConnectionInterop & { state: ConsoleConnection["state"] } {
    return {
      id: this.id,
      name: this.name ?? "",
      address: this.context.initArgs[0],
      state: this.state,
    };
  }

  private createConsole(...args: InitArgs) {
    const client = new SimpleClient(...args);

    restoreEventRegistrations(client, this.listeners);

    const proxy = proxyEventRegistrationInterface(client, this.listeners);
    proxy.connect({ clientDescription: "MIDI Integration" });

    return proxy;
  }

  /**
   * Create a session for maintaining what event listeners are registered.
   * Note: You should **not** store references to the PreSonus client instance, as it may change.
   */
  withSession(
    fn: (client: SimpleClient, listeners: EventRegistrationPersistence) => void,
    listeners?: EventRegistrationPersistence
  ) {
    const sessionListeners = listeners ?? {};
    return fn(
      proxyEventRegistrationInterface(this.client, sessionListeners),
      sessionListeners
    );
  }

  reconnect() {
    throw new Error("Reconnect not implemented");
  }
}
