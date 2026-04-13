/**
 * Midi Connections are the link to the ports
 */

import { Output as _Output, Input } from "easymidi";
import easymidi from "easymidi";

import {
  proxyEventRegistrationInterface,
  restoreEventRegistrations,
  type EventRegistrationPersistence,
} from "./EventRegistrationPersistence";
import { nanoid } from "nanoid";
import type { MidiConnectionInterop } from "./types/MidiConnectionInterop";
import { EventEmitter } from "node:events";
import _logger from "$lib/logger";
const logger = _logger.child({ module: "MidiConnection" });

export class Output extends _Output {
  #emitter: EventEmitter;
  constructor(...args: ConstructorParameters<typeof _Output>) {
    super(...args);
    this.#emitter = new EventEmitter();
    this.send = new Proxy(this.send, {
      apply: (target, thisArg, argumentsList) => {
        if (argumentsList.length === 1) {
          // Message with no parameter
          this.#emitter.emit("event", argumentsList[0]);
        } else {
          // Message with parameter
          this.#emitter.emit("event", {
            ...argumentsList[1],
            _type: argumentsList[0],
          });
        }

        return Reflect.apply(target, thisArg, argumentsList);
      },
    });
  }

  on(evt: "raw", callback: (...args: any[]) => void): void;
  on(evt: "event", callback: (...args: any[]) => void): void;
  on(evt: string, callback: (...args: any[]) => void) {
    this.#emitter.on(evt, callback);
  }

  off(evt: "raw", callback: (...args: any[]) => void): void;
  off(evt: "event", callback: (...args: any[]) => void): void;
  off(evt: string, callback: (...args: any[]) => void) {
    this.#emitter.off(evt, callback);
  }
  emitRaw(data: any) {
    this.#emitter.emit("raw", data);
  }
}

export class MidiConnectionManager {
  static discover() {
    return {
      input: easymidi.getInputs(),
      output: easymidi.getOutputs(),
    };
  }

  #connections: Record<string, MidiConnection>;
  constructor() {
    this.#connections = {};
  }

  get connections() {
    return this.#connections;
  }

  discover() {
    return MidiConnectionManager.discover();
  }

  get(id: string) {
    return this.#connections[id];
  }

  /**
   * Register the connection with the manager
   */
  private register(instance: MidiConnection) {
    this.#connections[instance.id] = instance;
    return instance;
  }

  addFromConfig(config: MidiConnectionInterop) {
    const instance = MidiConnection.fromConfig(config);
    return this.register(instance);
  }

  create(input: string | Input, output?: string | _Output) {
    const instance = new MidiConnection(input, output);
    return this.register(instance);
  }

  static createVirtualPair(name: string) {
    let inputDevice: Input = new easymidi.Input(
      `${name}-virtual`,
      true,
    ) as Input;
    let outputDevice: _Output = new easymidi.Output(
      `${name}-virtual`,
      true,
    ) as _Output;

    inputDevice.isPortOpen = () => true;
    return [inputDevice, outputDevice] as const;
  }

  createVirtual(name: string): MidiConnection {
    const [inputDevice, outputDevice] =
      MidiConnectionManager.createVirtualPair(name);

    let lastTime = new Date();

    {
      function simulateInput(bytes: number[]) {
        let currentTime = new Date();
        inputDevice._input.emit(
          "message",
          (currentTime.getTime() - lastTime.getTime()) / 1000,
          bytes,
        );
        lastTime = currentTime;
      }
    }

    return this.create(inputDevice, outputDevice);
  }
}

const portHasBeenRegistered = Symbol();

export class MidiConnection {
  private _id: string;

  private _connected: boolean;
  private _midiTargets: {
    input: string | Input;
    output?: string | { name: string };
  };

  private _midiConnections: {
    input: Input;
    output?: Output;
  };

  private listeners: EventRegistrationPersistence;
  name?: string;

  /**
   *
   * @param input MIDI stream from the external port
   * @param output MIDI stream to the external port
   */
  constructor(input: string | Input, output?: string | { name: string }) {
    this.listeners = {};
    this._id = nanoid();
    this._connected = false;

    this._midiTargets = {
      input,
      output,
    };
    this._midiConnections = {} as any;

    this.reconnect();
    setInterval(() => {
      if (!this.connected) {
        this.reconnect();
      }
    }, 5000);
  }

  reconnect() {
    this._connected = false;

    try {
      this.registerPorts(
        typeof this._midiTargets.input === "string"
          ? (new easymidi.Input(this._midiTargets.input) as Input)
          : this._midiTargets.input,
        this._midiTargets.output
          ? typeof this._midiTargets.output === "string"
            ? new Output(this._midiTargets.output)
            : new Output(this._midiTargets.output.name)
          : undefined,
      );

      this._connected = true;
    } catch {
      logger.warn(
        { input: this._midiTargets.input, output: this._midiTargets.output },
        `Failed to connect MIDI ports`,
      );

      // Temporarily create a virtual MIDI connection until the real connection can be established

      if (!this._midiConnections.input) {
        const [inputDevice, outputDevice] =
          MidiConnectionManager.createVirtualPair(this.id);
        this.registerPorts(inputDevice, new Output(outputDevice.name));
      }
    }
  }

  get connected() {
    return this._connected;
  }

  get logger() {
    return logger.child({ connectionId: this.id });
  }

  static fromConfig(config: MidiConnectionInterop) {
    const instance = new this(config.input!, config.output);
    instance.name = config.name;
    instance._id = config.id;
    return instance;
  }

  toJSON(): MidiConnectionInterop & { connected: MidiConnection["connected"] } {
    return {
      id: this.id,
      name: this.name ?? "(unknown)",
      input:
        typeof this._midiTargets.input === "string"
          ? this._midiTargets.input
          : this._midiTargets.input.name,
      output: this._midiTargets.output
        ? typeof this._midiTargets.output === "string"
          ? this._midiTargets.output
          : this._midiTargets.output.name
        : undefined,
      connected: this.connected,
    };
  }

  private registerPorts(input: Input, output?: Output) {
    // If the input port instance is new, then register the existing callbacks
    if (!Object.hasOwn(input, portHasBeenRegistered)) {
      Object.defineProperties(input, {
        [portHasBeenRegistered]: { value: true },
      });

      restoreEventRegistrations(input, this.listeners);
    }

    this._midiConnections.input = proxyEventRegistrationInterface(
      input,
      this.listeners,
    );
    this._midiConnections.output = output;
  }

  // reconnect() {
  //   throw new Error("MIDIConnection.reconnect() not implemented");
  // }

  get id() {
    return this._id;
  }

  get on() {
    return this._midiConnections.input.on.bind(this._midiConnections.input);
  }

  get once() {
    return this._midiConnections.input.once.bind(this._midiConnections.input);
  }

  get off() {
    return this._midiConnections.input.off.bind(this._midiConnections.input);
  }

  sendRaw(bytes: number[] | Buffer) {
    if (!this._midiConnections.output) {
      this.logger.warn(
        "MIDI output port not assigned, dropping sendRaw() request",
      );
      return;
    }

    const data = Buffer.isBuffer(bytes) ? [...bytes] : bytes;
    this._midiConnections.output?.emitRaw(data);
    this._midiConnections.output._output.sendMessage(data);
  }

  send: _Output["send"] = function (this: MidiConnection, ...args: any[]) {
    if (!this._midiConnections.output) {
      this.logger.warn(
        "MIDI output port not assigned, dropping send() request",
      );
      return;
    }

    return (this._midiConnections.output.send as any)(...args);
  };
}
