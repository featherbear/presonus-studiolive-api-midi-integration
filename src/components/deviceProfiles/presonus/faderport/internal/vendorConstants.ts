export const SysExHdr = Buffer.from([0xf0, 0x00, 0x01, 0x06, 0x02])

/**
 * Actually a polypressure
 */
export const SysEx_KeepAlive = Buffer.from([0xa0, 0x00, 0x00])

export const SysEx_Mfr = Buffer.from([0x00, 0x01, 0x06])
export const SysEx_FP16_ID = 0x16;
export const SysEx_FP8_ID = 0x02;

/**
 * Only available on FaderPort 16
 */
const FADERPORT_16_ONLY: (_: number) => number = _ => _

export enum FaderBtn {
    FADER_1 = 0x68,
    FADER_2 = 0x69,
    FADER_3 = 0x6A,
    FADER_4 = 0x6B,
    FADER_5 = 0x6C,
    FADER_6 = 0x6D,
    FADER_7 = 0x6E,
    FADER_8 = 0x6F,
    FADER_9 = FADERPORT_16_ONLY(0x70),
    FADER_10 = FADERPORT_16_ONLY(0x71),
    FADER_11 = FADERPORT_16_ONLY(0x72),
    FADER_12 = FADERPORT_16_ONLY(0x73),
    FADER_13 = FADERPORT_16_ONLY(0x74),
    FADER_14 = FADERPORT_16_ONLY(0x75),
    FADER_15 = FADERPORT_16_ONLY(0x76),
    FADER_16 = FADERPORT_16_ONLY(0x77),
};

export enum Encoder {
    PAN_PARAM,
    SESSION_NAVIGATOR
};

export enum Button {
    PAN_PARAM = 0x20,
    ARM = 0x00,
    SOLO_CLEAR = 0x01,
    MUTE_CLEAR = 0x02,
    BYPASS = 0x03,
    MACRO = 0x04,
    LINK = 0x05,
    SHIFT_LEFT = 0x46,

    SELECT_1 = 0x18,
    SELECT_2 = 0x19,
    SELECT_3 = 0x1A,
    SELECT_4 = 0x1B,
    SELECT_5 = 0x1C,
    SELECT_6 = 0x1D,
    SELECT_7 = 0x1E,
    SELECT_8 = 0x1F,
    SELECT_9 = FADERPORT_16_ONLY(0x07),
    SELECT_10 = FADERPORT_16_ONLY(0x21),
    SELECT_11 = FADERPORT_16_ONLY(0x22),
    SELECT_12 = FADERPORT_16_ONLY(0x23),
    SELECT_13 = FADERPORT_16_ONLY(0x24),
    SELECT_14 = FADERPORT_16_ONLY(0x25),
    SELECT_15 = FADERPORT_16_ONLY(0x26),
    SELECT_16 = FADERPORT_16_ONLY(0x27),

    SOLO_1 = 0x08,
    SOLO_2 = 0x09,
    SOLO_3 = 0x0A,
    SOLO_4 = 0x0B,
    SOLO_5 = 0x0C,
    SOLO_6 = 0x0D,
    SOLO_7 = 0x0E,
    SOLO_8 = 0x0F,
    SOLO_9 = FADERPORT_16_ONLY(0x50),
    SOLO_10 = FADERPORT_16_ONLY(0x51),
    SOLO_11 = FADERPORT_16_ONLY(0x52),
    SOLO_12 = FADERPORT_16_ONLY(0x53),
    SOLO_13 = FADERPORT_16_ONLY(0x54),
    SOLO_14 = FADERPORT_16_ONLY(0x55),
    SOLO_15 = FADERPORT_16_ONLY(0x56),
    SOLO_16 = FADERPORT_16_ONLY(0x57),

    MUTE_1 = 0x10,
    MUTE_2 = 0x11,
    MUTE_3 = 0x12,
    MUTE_4 = 0x13,
    MUTE_5 = 0x14,
    MUTE_6 = 0x15,
    MUTE_7 = 0x16,
    MUTE_8 = 0x17,
    MUTE_9 = FADERPORT_16_ONLY(0x78),
    MUTE_10 = FADERPORT_16_ONLY(0x79),
    MUTE_11 = FADERPORT_16_ONLY(0x7A),
    MUTE_12 = FADERPORT_16_ONLY(0x7B),
    MUTE_13 = FADERPORT_16_ONLY(0x7C),
    MUTE_14 = FADERPORT_16_ONLY(0x7D),
    MUTE_15 = FADERPORT_16_ONLY(0x7E),
    MUTE_16 = FADERPORT_16_ONLY(0x7F),

    TRACK = 0x28,
    EDIT_PLUGINS = 0x2B,
    SEND = 0x29,
    PAN = 0x2A,

    AUDIO = 0x3E,
    VI = 0x3F,
    BUS = 0x40,
    VCA = 0x41,
    ALL = 0x42,
    SHIFT_RIGHT = 0x06,

    LATCH = 0x4E,
    TRIM = 0x4C,
    OFF = 0xF4,
    TOUCH = 0x4D,
    WRITE = 0x4B,
    READ = 0x4A,

    PREV = 0x2E,
    NEXT = 0x2F,

    SESSION_NAVIGATOR = 0x53,

    CHANNEL = 0x36,
    ZOOM = 0x37,
    SCROLL = 0x38,
    BANK = 0x39,
    MASTER = 0x3A,
    CLICK = 0x3B,
    SECTION = 0x3C,
    MARKER = 0x3D,
    REWIND = 0x5B,
    FAST_FORWARD = 0x5C,
    STOP = 0x5D,
    RECORD = 0x5F,
    PLAY = 0x5E,

};

export const FOOTSWITCH_CODE = 0x66;


export enum LED_SINGLE {
    ARM = Button.ARM,
    SOLO_CLEAR = Button.SOLO_CLEAR,
    MUTE_CLEAR = Button.MUTE_CLEAR,
    
    SHIFT_LEFT = Button.SHIFT_LEFT,
    SHIFT_RIGHT = Button.SHIFT_RIGHT,

    TRACK = Button.TRACK,
    EDIT_PLUGINS = Button.EDIT_PLUGINS,
    SEND = Button.SEND,
    PAN = Button.PAN,

    CHANNEL = Button.CHANNEL,
    ZOOM = Button.ZOOM,
    SCROLL = Button.SCROLL,
    BANK = Button.BANK,
    MASTER = Button.MASTER,
    CLICK = Button.CLICK,
    SECTION = Button.SECTION,
    MARKER = Button.MARKER,
    REWIND = Button.REWIND,
    FAST_FORWARD = Button.FAST_FORWARD,
    STOP = Button.STOP,
    RECORD = Button.RECORD,
    PLAY = Button.PLAY,

    SOLO_1 = Button.SOLO_1,
    SOLO_2 = Button.SOLO_2,
    SOLO_3 = Button.SOLO_3,
    SOLO_4 = Button.SOLO_4,
    SOLO_5 = Button.SOLO_5,
    SOLO_6 = Button.SOLO_6,
    SOLO_7 = Button.SOLO_7,
    SOLO_8 = Button.SOLO_8,
    SOLO_9 = FADERPORT_16_ONLY(Button.SOLO_9),
    SOLO_10 = FADERPORT_16_ONLY(Button.SOLO_10),
    SOLO_11 = FADERPORT_16_ONLY(Button.SOLO_11),
    SOLO_12 = FADERPORT_16_ONLY(Button.SOLO_12),
    SOLO_13 = FADERPORT_16_ONLY(Button.SOLO_13),
    SOLO_14 = FADERPORT_16_ONLY(Button.SOLO_14),
    SOLO_15 = FADERPORT_16_ONLY(Button.SOLO_15),
    SOLO_16 = FADERPORT_16_ONLY(Button.SOLO_16),

    MUTE_1 = Button.MUTE_1,
    MUTE_2 = Button.MUTE_2,
    MUTE_3 = Button.MUTE_3,
    MUTE_4 = Button.MUTE_4,
    MUTE_5 = Button.MUTE_5,
    MUTE_6 = Button.MUTE_6,
    MUTE_7 = Button.MUTE_7,
    MUTE_8 = Button.MUTE_8,
    MUTE_9 = FADERPORT_16_ONLY(Button.MUTE_9),
    MUTE_10 = FADERPORT_16_ONLY(Button.MUTE_10),
    MUTE_11 = FADERPORT_16_ONLY(Button.MUTE_11),
    MUTE_12 = FADERPORT_16_ONLY(Button.MUTE_12),
    MUTE_13 = FADERPORT_16_ONLY(Button.MUTE_13),
    MUTE_14 = FADERPORT_16_ONLY(Button.MUTE_14),
    MUTE_15 = FADERPORT_16_ONLY(Button.MUTE_15),
    MUTE_16 = FADERPORT_16_ONLY(Button.MUTE_16),
};

export enum LED_RGB {
    SELECT_1 = Button.SELECT_1,
    SELECT_2 = Button.SELECT_2,
    SELECT_3 = Button.SELECT_3,
    SELECT_4 = Button.SELECT_4,
    SELECT_5 = Button.SELECT_5,
    SELECT_6 = Button.SELECT_6,
    SELECT_7 = Button.SELECT_7,
    SELECT_8 = Button.SELECT_8,
    SELECT_9 = FADERPORT_16_ONLY(Button.SELECT_9),
    SELECT_10 = FADERPORT_16_ONLY(Button.SELECT_10),
    SELECT_11 = FADERPORT_16_ONLY(Button.SELECT_11),
    SELECT_12 = FADERPORT_16_ONLY(Button.SELECT_12),
    SELECT_13 = FADERPORT_16_ONLY(Button.SELECT_13),
    SELECT_14 = FADERPORT_16_ONLY(Button.SELECT_14),
    SELECT_15 = FADERPORT_16_ONLY(Button.SELECT_15),
    SELECT_16 = FADERPORT_16_ONLY(Button.SELECT_16),

    LATCH = Button.LATCH,
    TRIM = Button.TRIM,
    OFF = Button.OFF,
    TOUCH = Button.TOUCH,
    WRITE = Button.WRITE,
    READ = Button.READ,

    AUDIO = Button.AUDIO,
    VI = Button.VI,
    BUS = Button.BUS,
    VCA = Button.VCA,
    ALL = Button.ALL,

    BYPASS = Button.BYPASS,
    MACRO = Button.MACRO,
    LINK = Button.LINK,
}

export type LED = LED_RGB | LED_SINGLE
export const LED = {...LED_SINGLE, ...LED_RGB}

export enum VALUE_BAR_MODE {
    NORMAL = 0,
    BIPOLAR = 1,
    FILL = 2,
    SPREAD = 3,
    OFF = 4
};
export enum SCRIBBLE_STRIP_REDRAW_MODE {
    KEEP = 0,
    DISCARD = 1,
};

export enum SCRIBBLE_STRIP_MODE {
    DEFAULT = 0,
    ALTERNATIVE_DEFAULT = 1,
    SMALL_TEXT = 2,
    LARGE_TEXT = 3,
    LARGE_TEXT_METERING = 4,
    DEFAULT_TEXT_METERING = 5,
    MIXED_TEST = 6,
    ALTERNATIVE_TEXT_METERING = 7,
    MIXED_TEXT_METERING = 8,
    MENU = 9,
};

export enum SCRIBBLE_STRIP_STRING_FORMAT {
    CENTER = 0b000,
    LEFT = 0b001,
    RIGHT = 0b010,
    INVERT = 0b100
} 

export enum BUTTON_STATE {
    OFF = 0,
    ON = 0x7F,
    FLASH = 0x01
}