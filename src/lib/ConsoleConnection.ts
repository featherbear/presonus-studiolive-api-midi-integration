import { nanoid } from "nanoid";
import { SimpleClient } from "presonus-studiolive-api/simple";

import {
  proxyEventRegistrationInterface,
  restoreEventRegistrations,
  type EventRegistrationPersistence,
} from "./EventRegistrationPersistence";

type InitArgs = ConstructorParameters<typeof SimpleClient>;

export class ConsoleConnectionManager {
  #connections: Record<string, ConsoleConnection>;
  constructor() {
    this.#connections = {};
  }

  static discover() {
    return SimpleClient.discover();
  }

  discover() {
    return ConsoleConnectionManager.discover();
  }

  create(...args: InitArgs) {
    const instance = new ConsoleConnection(this, ...args);
    this.#connections[instance.id] = instance;
    return instance;
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
  private listeners: EventRegistrationPersistence;
  client: SimpleClient;

  constructor(manager: ConsoleConnectionManager, ...args: InitArgs) {
    this.context = {
      manager,
      initArgs: args,
    };
    this.id = nanoid();
    this.listeners = {};
    this.client = this.createConsole(...args);
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
   * Note: You should **not** store the client instance, as it may be released.
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

const consoleConnectionManagerInstance = new ConsoleConnectionManager();
export default consoleConnectionManagerInstance;
