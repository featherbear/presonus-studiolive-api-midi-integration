/**
 * Midi Connections are the link to the ports
 */

import { Output as _Output, type Input } from "easymidi";
import easymidi from "easymidi";

import {
  proxyEventRegistrationInterface,
  restoreEventRegistrations,
  type EventRegistrationPersistence,
} from "./EventRegistrationPersistence";
import { nanoid } from "nanoid";
import type { MidiConnectionInterop } from "./types/MidiConnectionInterop";
import { EventEmitter } from "node:events";

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

  createVirtual(name: string): MidiConnection {
    let inputDevice: Input = new easymidi.Input(
      name + "-virtual",
      true
    ) as Input;
    let outputDevice: _Output = new easymidi.Output(
      name + "-virtual",
      true
    ) as _Output;

    inputDevice.isPortOpen = () => true;

    let lastTime = new Date();

    {
      function simulateInput(bytes: number[]) {
        let currentTime = new Date();
        inputDevice._input.emit(
          "message",
          (currentTime.getTime() - lastTime.getTime()) / 1000,
          bytes
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
  input!: Input;
  output?: Output;
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

    this.registerPorts(
      typeof input === "string" ? (new easymidi.Input(input) as Input) : input,
      output
        ? typeof output === "string"
          ? new Output(output)
          : new Output(output.name)
        : undefined
    );
  }

  static fromConfig(config: MidiConnectionInterop) {
    const instance = new this(config.input, config.output);
    instance.name = config.name;
    instance._id = config.id;
    return instance;
  }

  toJSON(): MidiConnectionInterop {
    return {
      id: this.id,
      name: this.name ?? "",
      input: this.input.name,
      output: this.output?.name,
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

    this.input = proxyEventRegistrationInterface(input, this.listeners);
    this.output = output;
  }

  // reconnect() {
  //   throw new Error("MIDIConnection.reconnect() not implemented");
  // }

  get id() {
    return this._id;
  }

  get on() {
    return this.input.on.bind(this.input);
  }

  get once() {
    return this.input.once.bind(this.input);
  }

  get off() {
    return this.input.off.bind(this.input);
  }

  sendRaw(bytes: number[] | Buffer) {
    if (!this.output) {
      console.warn("MIDI output port not assigned, dropping sendRaw() request");
      return;
    }

    const data = Buffer.isBuffer(bytes) ? [...bytes] : bytes;
    this.output?.emitRaw(data);
    this.output._output.sendMessage(data);
  }

  send: _Output["send"] = function (this: MidiConnection, ...args: any[]) {
    if (!this.output) {
      console.warn("MIDI output port not assigned, dropping send() request");
      return;
    }

    return (this.output.send as any)(...args);
  };
}
