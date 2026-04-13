import { ConsoleConnection } from "$lib/ConsoleConnection";
import { DeviceController } from "$lib/DeviceController";
import {
  MessageCode,
  parseChannelString,
  type ChannelSelector,
} from "@featherbear/presonus-studiolive-api";
import FaderPortDevice from "./device";
import {
  BUTTON,
  BUTTON_STATE,
  ENCODER,
  FADER_TOUCH,
  LED_RGB,
  LED_SINGLE,
  SCRIBBLE_STRIP_MODE,
  VELOCITY,
} from "./lib/vendorConstants";
import {
  flattenEventRegistration,
  proxyEventRegistrationInterface,
  type EventRegistrationPersistence,
} from "$lib/EventRegistrationPersistence";
import { settingsPathToChannelSelector } from "@featherbear/presonus-studiolive-api/simple";
import type { Faders16Channel } from "./lib/types";
import { MAX_14 } from "./lib/valueGenerator";
import type { MidiConnection } from "$lib/MidiConnection";
import type { FaderPortConfig } from "./config";

const layout = {
  FADER_ROW: [
    FADER_TOUCH.FADER_1,
    FADER_TOUCH.FADER_2,
    FADER_TOUCH.FADER_3,
    FADER_TOUCH.FADER_4,
    FADER_TOUCH.FADER_5,
    FADER_TOUCH.FADER_6,
    FADER_TOUCH.FADER_7,
    FADER_TOUCH.FADER_8,
  ],
  MUTE_ROW: [
    LED_SINGLE.MUTE_1,
    LED_SINGLE.MUTE_2,
    LED_SINGLE.MUTE_3,
    LED_SINGLE.MUTE_4,
    LED_SINGLE.MUTE_5,
    LED_SINGLE.MUTE_6,
    LED_SINGLE.MUTE_7,
    LED_SINGLE.MUTE_8,
  ],
  SOLO_ROW: [
    LED_SINGLE.SOLO_1,
    LED_SINGLE.SOLO_2,
    LED_SINGLE.SOLO_3,
    LED_SINGLE.SOLO_4,
    LED_SINGLE.SOLO_5,
    LED_SINGLE.SOLO_6,
    LED_SINGLE.SOLO_7,
    LED_SINGLE.SOLO_8,
  ],
  SELECT_ROW_LED: [
    LED_RGB.SELECT_1,
    LED_RGB.SELECT_2,
    LED_RGB.SELECT_3,
    LED_RGB.SELECT_4,
    LED_RGB.SELECT_5,
    LED_RGB.SELECT_6,
    LED_RGB.SELECT_7,
    LED_RGB.SELECT_8,
  ],
  SELECT_ROW_BTN: [
    BUTTON.SELECT_1,
    BUTTON.SELECT_2,
    BUTTON.SELECT_3,
    BUTTON.SELECT_4,
    BUTTON.SELECT_5,
    BUTTON.SELECT_6,
    BUTTON.SELECT_7,
    BUTTON.SELECT_8,
    BUTTON.SELECT_9,
    BUTTON.SELECT_10,
    BUTTON.SELECT_11,
    BUTTON.SELECT_12,
    BUTTON.SELECT_13,
    BUTTON.SELECT_14,
    BUTTON.SELECT_15,
    BUTTON.SELECT_16,
  ],
};

const isChannelEqual = (a?: ChannelSelector, b?: ChannelSelector) => {
  if (!a || !b) return false;
  if (a.channel !== b.channel) return false;
  if (a.type !== b.type) return false;
  if (a.mixType !== b.mixType) return false;
  if (a.mixNumber !== b.mixNumber) return false;
  return true;
};

class FaderPortController extends DeviceController<
  FaderPortDevice,
  FaderPortConfig
> {
  #selectedChannel?: ChannelSelector;
  #currentPage: number;

  #consoleListeners: EventRegistrationPersistence;

  /**
   * State map to ignore the button noteoff events (technically they are noteon with velocity 0)
   */
  #cancelFeedbackMap: Record<any, boolean>;

  constructor(device: MidiConnection, config: FaderPortConfig) {
    super(device, config);

    this.#selectedChannel = undefined;
    this.#currentPage = 0;
    this.#consoleListeners = {};
    this.#cancelFeedbackMap = {};

    this.init();
  }

  initMidiDevice(connection: MidiConnection): void {
    this.device = new FaderPortDevice(connection);
  }

  get visibleChannels() {
    return this.config.pages[this.#currentPage];
  }

  destroy() {
    for (const registration of flattenEventRegistration(
      this.#consoleListeners
    )) {
      this.console?.client.off(
        registration.event as any,
        registration.callback as any
      );
    }
  }

  initConsole(consoleConnection: ConsoleConnection) {
    if (this.console) {
      throw new Error("Console connection already established");
    }

    consoleConnection.withSession((client) => {
      client.on("level", (evt) => this.notifyFader(evt.channel, evt.level));
      client.on("mute", (evt) => this.notifyMute(evt.channel, evt.status));
      client.on("solo", (evt) => this.notifySolo(evt.channel, evt.status));
      client.on(
        MessageCode.ParamChars,
        ({ name, value }: { name: string; value: string }) => {
          if (name.endsWith("color")) {
            const channel = settingsPathToChannelSelector(name);
            for (let i = 0; i < this.visibleChannels.length; i++) {
              const visibleChannel = this.visibleChannels[i];
              if (
                !visibleChannel ||
                !isChannelEqual(visibleChannel.channel, channel)
              ) {
                continue;
              }
              this.device.setLEDColour(layout.SELECT_ROW_LED[i], [
                ...(<[number, number, number]>(<any>Buffer.from(value, "hex"))),
              ]);
              break;
            }
          }
        }
      );
      client.on(MessageCode.ParamString, ({ name, value }) => {
        if (name.endsWith("username")) {
          const channel = settingsPathToChannelSelector(name);
          for (let i = 0; i < this.visibleChannels.length; i++) {
            const visibleChannel = this.visibleChannels[i];
            if (
              !visibleChannel ||
              !isChannelEqual(visibleChannel.channel, channel)
            ) {
              continue;
            }
            this.device.setScribbleStrip((i + 1) as Faders16Channel, 2, value);
            break;
          }
        }
      });
      consoleConnection.client.once("connected", () => {
        this.refreshVisibleChannels();
      });
    }, this.#consoleListeners);

    this.console = consoleConnection;
  }

  private notifyMute(channel: ChannelSelector, state: boolean) {
    for (let i = 0; i < this.visibleChannels.length; i++) {
      const visibleChannel = this.visibleChannels[i];
      if (!visibleChannel || !isChannelEqual(visibleChannel.channel, channel)) {
        continue;
      }
      this.device.setLEDState(
        layout.MUTE_ROW[i],
        state ? BUTTON_STATE.ON : BUTTON_STATE.OFF
      );
      // Could have the same channel twice
      // return;
    }
  }

  private notifySolo(channel: ChannelSelector, state: boolean) {
    for (let i = 0; i < this.visibleChannels.length; i++) {
      const visibleChannel = this.visibleChannels[i];
      if (!visibleChannel || !isChannelEqual(visibleChannel.channel, channel)) {
        continue;
      }
      this.device.setLEDState(
        layout.SOLO_ROW[i],
        state ? BUTTON_STATE.ON : BUTTON_STATE.OFF
      );

      // Could have the same channel twice
      // return;
    }
  }

  private notifyFader(channel: ChannelSelector, level100: number) {
    for (let i = 0; i < this.visibleChannels.length; i++) {
      // Don't move the fader if it is actively touched
      if (this.#cancelFeedbackMap[layout.FADER_ROW[i]]) continue;

      const visibleChannel = this.visibleChannels[i];
      if (!visibleChannel || !isChannelEqual(visibleChannel.channel, channel)) {
        continue;
      }
      this.device.setFaderPosition100((i + 1) as Faders16Channel, level100);
      // Could have the same channel twice
      // return;
    }
  }

  private clearScribbleStrip(strip: Faders16Channel) {
    this.device.setScribbleStripMode(strip, SCRIBBLE_STRIP_MODE.DEFAULT, false);
    // this.device.setScribbleStrip(strip, 1, "");
    // this.device.setScribbleStrip(strip, 2, "");
    // this.device.setScribbleStrip(strip, 3, "");
    // this.device.setScribbleStrip(strip, 4, "");
  }

  private refreshVisibleChannels() {
    if (!this.console) {
      console.warn("Console connection not established");
      return;
    }

    for (let i = 0; i < this.visibleChannels.length; i++) {
      const visibleChannel = this.visibleChannels[i];
      if (!visibleChannel) {
        // Channel is not set
        this.device.setLEDColour(layout.SELECT_ROW_LED[i], [
          ...(<[number, number, number]>(<any>Buffer.from("ffffff", "hex"))),
        ]);
        this.device.setLEDState(layout.SELECT_ROW_LED[i], BUTTON_STATE.OFF);
        this.device.setLEDState(layout.MUTE_ROW[i], BUTTON_STATE.OFF);
        this.device.setLEDState(layout.SOLO_ROW[i], BUTTON_STATE.OFF);
        this.device.setFaderPosition14((i + 1) as Faders16Channel, 0);

        this.clearScribbleStrip((i + 1) as Faders16Channel);

        continue;
      }

      this.device.setFaderPosition100(
        (i + 1) as Faders16Channel,
        this.console.client.getLevel(visibleChannel.channel)
      );

      this.device.setLEDState(
        layout.MUTE_ROW[i],
        this.console.client.getMute(visibleChannel.channel)
          ? BUTTON_STATE.ON
          : BUTTON_STATE.OFF
      );
      this.device.setLEDState(
        layout.SOLO_ROW[i],
        this.console.client.getSolo(visibleChannel.channel)
          ? BUTTON_STATE.ON
          : BUTTON_STATE.OFF
      );
      this.device.setLEDState(
        layout.SELECT_ROW_LED[i],
        this.#selectedChannel === visibleChannel.channel
          ? BUTTON_STATE.ON
          : BUTTON_STATE.OFF
      );

      let colour = this.console.client.getColour(visibleChannel.channel);
      if (typeof colour !== "string") colour = "ffffffff";
      this.device.setLEDColour(layout.SELECT_ROW_LED[i], [
        ...(<[number, number, number]>(<any>Buffer.from(colour, "hex"))),
      ]);

      this.device.setScribbleStripMode(
        (i + 1) as Faders16Channel,
        SCRIBBLE_STRIP_MODE.ALTERNATIVE_DEFAULT,
        false
      );

      //   switch (this._editMode) {
      //     case "pan":
      //       // this.setScribbleStripMode((i+1),  as Faders16ChannelSCRIBBLE_STRIP_MODE.ALTERNATIVE_TEXT_METERING, false)
      //       this.setValueBarMode((i + 1) as Faders16Channel, VALUE_BAR_MODE.BIPOLAR);
      //       // this.setValueBar((i+1),  as Faders16Channel100)
      //       break;
      //     default:
      //       this.setValueBarMode((i + 1) as Faders16Channel, VALUE_BAR_MODE.OFF);
      //       break;
      //   }

      this.device.setScribbleStrip(
        (i + 1) as Faders16Channel,
        1,
        visibleChannel.channel.channel!.toString()
      );

      if (visibleChannel.override?.name) {
        this.device.setScribbleStrip(
          (i + 1) as Faders16Channel,
          2,
          visibleChannel.override?.name
        );
      } else {
        let path = `${parseChannelString(visibleChannel.channel)}/username`;
        this.device.setScribbleStrip(
          (i + 1) as Faders16Channel,
          2,
          this.console.client.state.get(path)
        );
      }

      this.device.setScribbleStrip(
        (i + 1) as Faders16Channel,
        3,
        visibleChannel.channel.type
      );
    }
  }

  private selectChannel(channel: ChannelSelector) {
    this.#selectedChannel = channel;
    console.log("Selected channel", this.#selectedChannel);
    this.refreshVisibleChannels();
  }

  private setPageIndex(idx: number) {
    this.#currentPage = idx;
    this.refreshVisibleChannels();
  }

  init() {
    // TODO: we should probably call init automatically
    console.log("init called");
    this.device.connection.on("noteon", (note) => {
      setImmediate(() => {
        const feedback = () => this.device.connection.send("noteon", note);

        // Toggle fader feedback for fader events when it is active
        // This prevents level changes on the touched fader
        const channelIndex = layout.FADER_ROW.indexOf(note.note);
        if (channelIndex >= 0) {
          this.#cancelFeedbackMap[note.note] =
            note.velocity === VELOCITY.NOTEON;
          return;
        }

        // Check mute press
        const muteIndex = layout.MUTE_ROW.indexOf(note.note);
        if (muteIndex >= 0) {
          if (!this.visibleChannels[muteIndex]) return;
          if (note.velocity === VELOCITY.NOTEON) {
            this.console?.client.toggleMute(
              this.visibleChannels[muteIndex].channel
            );
          }

          return; // We will let the state feedback change the LED
        }

        // Check solo press
        const soloIndex = layout.SOLO_ROW.indexOf(note.note);
        if (soloIndex >= 0) {
          if (!this.visibleChannels[soloIndex]) return;
          if (note.velocity === VELOCITY.NOTEON) {
            this.console?.client.toggleSolo(
              this.visibleChannels[soloIndex].channel
            );
          }

          return; // We will let the state feedback change the LED
        }

        // Check select press
        const selectIndex = layout.SELECT_ROW_BTN.indexOf(note.note);
        if (selectIndex >= 0) {
          if (!this.visibleChannels[selectIndex]) return;
          if (note.velocity === VELOCITY.NOTEON) {
            this.selectChannel(this.visibleChannels[selectIndex].channel);
          }

          return; // We will let the state feedback change the LED
        }

        switch (note.note as BUTTON) {
          case BUTTON.SHIFT_LEFT:
          case BUTTON.SHIFT_RIGHT: {
            this.device.setLEDState(
              LED_SINGLE.SHIFT_LEFT,
              note.velocity === VELOCITY.NOTEON
                ? BUTTON_STATE.ON
                : BUTTON_STATE.OFF
            );
            this.device.setLEDState(
              LED_SINGLE.SHIFT_RIGHT,
              note.velocity === VELOCITY.NOTEON
                ? BUTTON_STATE.ON
                : BUTTON_STATE.OFF
            );
            return;
          }
        }

        if (note.velocity === VELOCITY.NOTEON) {
          switch (note.note as BUTTON) {
            case BUTTON.SOLO_CLEAR: {
              // this.API.setSolo()
              console.log("TODO: SOLO CLEAR");

              // feedback()
              return;
            }

            case BUTTON.PAN: {
              //   console.log("pan press");
              //   this.setEditMode(this._editMode === "pan" ? null : "pan");
              // feedback()
              return;
            }

            case BUTTON.PAN_PARAM: {
              //   if (this._editMode === "pan" && !!this.selectedChannel) {
              //     console.log(
              //       "TODO: Set pan of selected channel to centre",
              //       this.selectedChannel
              //     );
              //   }
              // feedback()
              return;
            }

            case BUTTON.PLAY: {
              // Seems to be a mute toggle
              //   const channels: ChannelSelector[] = [
              //     { type: "LINE", channel: 4 },
              //     { type: "LINE", channel: 5 },
              //     { type: "LINE", channel: 6 },
              //     { type: "LINE", channel: 7 },
              //     { type: "LINE", channel: 9 },
              //     { type: "LINE", channel: 10 },
              //     { type: "LINE", channel: 11 },
              //     { type: "LINE", channel: 12 },
              //   ];

              //   for (const channel of channels) {
              //     this.API.setMute(channel, !playStat);
              //   }
              //   playStat = !playStat;
              //   console.log("play");
              // feedback()
              return;
            }
            case BUTTON.NEXT: {
              if (this.config.options?.pagesLoop) {
                this.setPageIndex(
                  (this.#currentPage + 1) % this.config.pages.length
                );
              } else {
                this.setPageIndex(
                  Math.min(this.config.pages.length - 1, this.#currentPage + 1)
                );
              }

              feedback();
              return;
            }
            case BUTTON.PREV: {
              if (this.config.options?.pagesLoop) {
                this.setPageIndex(
                  (this.#currentPage - 1 + this.config.pages.length) %
                    this.config.pages.length
                );
              } else {
                this.setPageIndex(Math.max(0, this.#currentPage - 1));
              }
              feedback();
              return;
            }
          }
        }

        if (this.#cancelFeedbackMap[note.note]) {
          delete this.#cancelFeedbackMap[note.note];
        } else {
          feedback();
        }
      });
    });

    this.device.connection.on("pitch", (pitch) => {
      setImmediate(() => {
        let idx = pitch.channel;
        if (!this.visibleChannels[idx]) return;
        let level = (pitch.value / MAX_14) * 100;

        this.console?.client.setChannelVolumeLinear(
          this.visibleChannels[idx].channel,
          level
        );
        return;
      });
    });

    this.device.connection.on("cc", (change) => {
      setImmediate(() => {
        let delta = change.value;
        if (delta > 64) delta = -delta + 64;

        if (change.channel == 0) {
          switch (change.controller as ENCODER) {
            case ENCODER.PAN_PARAM: {
              console.log(change);

              let value = Math.ceil(Math.abs(delta) / 2);
              console.log("Param", delta);

              // if (this._editMode === "pan" && !!this.selectedChannel) {
              //   console.log(
              //     "TODO: Adjust pan of selected channel",
              //     this.selectedChannel,
              //     Math.sign(delta) * value
              //   );
              // }
              return;
            }

            case ENCODER.SESSION_NAVIGATOR: {
              console.log("SESS", delta);
              return;
            }
          }
        }
        console.log({ ...change, value: delta });
        return;
      });
    });
  }
}

export default FaderPortController;
