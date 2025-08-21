/**
 * Midi Connections are the link to the ports
 */

import type { Output, Input } from "$lib/types/easymidiInterop";
import easymidi from "easymidi";
import {
  proxyEventRegistrationInterface,
  restoreEventRegistrations,
  type EventRegistrationPersistence,
} from "./EventRegistrationPersistence";
import { nanoid } from "nanoid";
import z from "zod";
import type { MidiConnectionInterop } from "./types/MidiConnectionInterop";

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

  create(input: string | Input, output?: string | Output) {
    const instance = new MidiConnection(input, output);
    return this.register(instance);
  }

  createVirtual(name: string): MidiConnection {
    let inputDevice: Input = new easymidi.Input(
      name + "-virtual",
      true
    ) as Input;
    let outputDevice: Output = new easymidi.Output(
      name + "-virtual",
      true
    ) as Output;

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
  private input!: Input;
  private output?: Output;
  private listeners: EventRegistrationPersistence;
  name?: string

  /**
   *
   * @param input MIDI stream from the external port
   * @param output MIDI stream to the external port
   */
  constructor(input: string | Input, output?: string | Output) {
    this.listeners = {};
    this._id = nanoid();

    this.registerPorts(
      typeof input === "string" ? (new easymidi.Input(input) as Input) : input,
      output
        ? typeof output === "string"
          ? (new easymidi.Output(output) as Output)
          : output
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
    this.output._output.sendMessage(
      Buffer.isBuffer(bytes) ? [...bytes] : bytes
    );
  }

  send: Output["send"] = function (this: MidiConnection, ...args: any[]) {
    if (!this.output) {
      console.warn("MIDI output port not assigned, dropping send() request");
      return;
    }

    return (this.output.send as any)(...args);
  };
}

const midiConnectionManagerInstance = new MidiConnectionManager();
export default midiConnectionManagerInstance;
