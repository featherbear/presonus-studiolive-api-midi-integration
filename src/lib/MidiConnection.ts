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

  discover() {
    return MidiConnectionManager.discover();
  }

  register(inputDevice: string | Input, outputDevice?: string | Output) {
    const instance = new MidiConnection(
      typeof inputDevice === "string"
        ? (new easymidi.Input(inputDevice) as Input)
        : inputDevice,

      outputDevice
        ? typeof outputDevice === "string"
          ? (new easymidi.Output(outputDevice) as Output)
          : outputDevice
        : undefined
    );

    this.#connections[instance.id] = instance;
    return instance;
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

    return this.register(inputDevice, outputDevice);
  }
}

const portHasBeenRegistered = Symbol();

export class MidiConnection {
  readonly id: string;
  private input!: Input;
  private output?: Output;
  private listeners: EventRegistrationPersistence;

  /**
   *
   * @param input MIDI stream from the external port
   * @param output MIDI stream to the external port
   */
  constructor(input: Input, output?: Output) {
    this.listeners = {};
    this.id = nanoid();

    this.registerPorts(input, output);
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

export default new MidiConnectionManager();

type ParametersZ<T extends Output["send"]> = T extends (
  event: infer X,
  data: infer P
) => any
  ? [X, P]
  : never;
