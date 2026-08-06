import { nanoid } from "nanoid";
import { SimpleClient } from "@featherbear/presonus-studiolive-api/simple";
import { Discovery, type DiscoveryType } from "@featherbear/presonus-studiolive-api";

import {
  proxyEventRegistrationInterface,
  restoreEventRegistrations,
  type EventRegistrationPersistence,
} from "./EventRegistrationPersistence";
import type { ConsoleConnectionInterop } from "./types/ConsoleConnectionInterop";
import _logger from "$lib/logger";

const logger = _logger.child({ module: "ConsoleConnection" });

type InitArgs = ConstructorParameters<typeof SimpleClient>;
type ConnectionAddress = NonNullable<ConsoleConnectionInterop["address"]>;
type ConsoleSession = {
  fn: (client: SimpleClient, listeners: EventRegistrationPersistence) => void;
  listeners: EventRegistrationPersistence;
};

const discoveryClient = new Discovery();
let discoveredConsoles: Record<string, DiscoveryType> = {};
discoveryClient.on("discover", (entry: DiscoveryType) => {
  if (!entry.serial) {
    logger.warn({ entry }, "Dropping console discovery without serial");
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

function getDiscoveredAddress(serial?: string): ConnectionAddress | undefined {
  if (!serial) return undefined;

  const entry = discoveredConsoles[serial];
  if (!entry) return undefined;

  if (new Date().getTime() - entry.timestamp.getTime() >= 10 * 1000) {
    return undefined;
  }

  return {
    host: entry.ip,
    port: entry.port,
  };
}

function isSameAddress(a?: ConnectionAddress, b?: ConnectionAddress) {
  return a?.host === b?.host && (a?.port ?? 53000) === (b?.port ?? 53000);
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

  delete(id: string) {
    const connection = this.#connections[id];
    if (!connection) return false;

    connection.close();
    delete this.#connections[id];
    return true;
  }

  private register(instance: ConsoleConnection) {
    this.#connections[instance.id] = instance;
    return instance;
  }

  addFromConfig(config: ConsoleConnectionInterop) {
    const existingConnection = this.#connections[config.id];
    if (existingConnection) {
      return existingConnection.updateFromConfig(config);
    }

    const instance = new ConsoleConnection(this, config);
    return this.register(instance);
  }

  create(...args: InitArgs) {
    const instance = new ConsoleConnection(this, {
      id: nanoid(),
      name: "",
      address: args[0],
    });
    return this.register(instance);
  }

  get connections() {
    return this.#connections;
  }
}

export class ConsoleConnection {
  private context: {
    manager: ConsoleConnectionManager;
    config: ConsoleConnectionInterop;
  };
  private activeAddress?: ConnectionAddress;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private replacingClient: boolean;
  private sessions: ConsoleSession[];
  id: string;
  name?: string;
  private listeners: EventRegistrationPersistence;
  private clientInstance?: SimpleClient;
  private _state: "connected" | "closed" | "error" | "reconnecting" | null;

  constructor(manager: ConsoleConnectionManager, config: ConsoleConnectionInterop) {
    this.context = {
      manager,
      config: structuredClone(config),
    };
    this.id = config.id;
    this.name = config.name;
    this.listeners = {};
    this.sessions = [];
    this._state = null;
    this.replacingClient = false;
    this.createConsole();
  }

  get client() {
    if (!this.clientInstance) {
      throw new Error(`Console connection ${this.id} is waiting for discovery`);
    }

    return this.clientInstance;
  }

  get state() {
    return this._state;
  }

  toJSON(): ConsoleConnectionInterop & { state: ConsoleConnection["state"] } {
    return {
      id: this.id,
      name: this.name ?? "",
      serial: this.context.config.serial,
      address: this.context.config.address,
      state: this.state,
    };
  }

  updateFromConfig(config: ConsoleConnectionInterop) {
    this.close();
    this.id = config.id;
    this.name = config.name;
    this.context.config = structuredClone(config);
    this.createConsole();
    return this;
  }

  private resolveAddress() {
    const discoveredAddress = getDiscoveredAddress(this.context.config.serial);
    if (discoveredAddress) {
      this.context.config.address = discoveredAddress;
      return discoveredAddress;
    }

    if (this.context.config.address?.host) {
      return this.context.config.address;
    }
    return undefined;
  }

  private scheduleSerialAddressRefresh(delay = 1000) {
    if (
      !this.context.config.serial ||
      this.replacingClient ||
      this.reconnectTimer
    ) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;

      const nextAddress = getDiscoveredAddress(this.context.config.serial);
      if (!nextAddress) {
        this._state = "reconnecting";
        this.scheduleSerialAddressRefresh(3000);
        return;
      }

      if (isSameAddress(this.activeAddress, nextAddress)) {
        return;
      }

      this.replacingClient = true;
      const oldClient = this.clientInstance;
      this.context.config.address = nextAddress;
      this.createConsole();
      if (!oldClient) {
        this.replacingClient = false;
        return;
      }

      oldClient
        .close()
        .catch(() => undefined)
        .finally(() => {
          this.replacingClient = false;
        });
    }, delay);
  }

  private attachClientStateListeners(client: SimpleClient) {
    client.on("connected", () => {
      this._state = "connected";
    });
    client.on("closed", () => {
      this._state = "closed";
      this.scheduleSerialAddressRefresh();
    });
    client.on("error", () => {
      this._state = "error";
      this.scheduleSerialAddressRefresh();
    });
    client.on("reconnecting", () => {
      this._state = "reconnecting";
      this.scheduleSerialAddressRefresh();
    });
  }

  private createConsole() {
    const address = this.resolveAddress();
    if (!address) {
      this._state = "reconnecting";
      this.clientInstance = undefined;
      this.scheduleSerialAddressRefresh(3000);
      return;
    }

    this.activeAddress = address;
    const client = new SimpleClient(address);

    restoreEventRegistrations(client, this.listeners);

    const proxy = proxyEventRegistrationInterface(client, this.listeners);
    this.attachClientStateListeners(proxy);
    this.clientInstance = proxy;
    this.restoreSessions();
    proxy.connect({ clientDescription: "MIDI Integration" });
  }

  private restoreSessions() {
    for (const session of this.sessions) {
      session.fn(
        proxyEventRegistrationInterface(this.client, session.listeners),
        session.listeners,
      );
    }
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
    this.sessions.push({ fn, listeners: sessionListeners });

    if (!this.clientInstance) {
      return;
    }

    return fn(
      proxyEventRegistrationInterface(this.client, sessionListeners),
      sessionListeners
    );
  }

  reconnect() {
    throw new Error("Reconnect not implemented");
  }

  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.clientInstance?.close().catch(() => undefined);
  }
}
