import dotenv from 'dotenv'
dotenv.config()

type Entry = {
    type: 'string' | 'number' | 'boolean' | ((input) => unknown),
    default?: any
}

const Schema = {
    CONSOLE_HOST: { type: 'string' },
    CONSOLE_PORT: { type: 'number', default: 53000 },
    SERVER_HOST: { type: 'string', default: "0.0.0.0" },
    SERVER_PORT: { type: 'number', default: 0 },
    SERVER_ENABLE: { type: 'boolean', default: false },
    SERVER_WEBMIDI: { type: 'boolean', default: false },
    SERVER_WEBMIDI_EXCLUSIVE: { type: 'boolean', default: false },
} as const

// For linting and compile-time check
const Schema_typecheck: {
    [KEY: string]: Entry
} = Schema

const Resolved: {
    [KEY in keyof typeof Schema]: typeof Schema[KEY]['type'] extends 'number' ? number : unknown
    & typeof Schema[KEY]['type'] extends 'string' ? string : unknown
    & typeof Schema[KEY]['type'] extends 'boolean' ? boolean : unknown
} = Object.entries(Schema_typecheck).reduce((obj, [key, opts]) => ({
    ...obj,
    [key]: ({
        'string': (v) => v,
        'number': Number.parseInt,
        'boolean': (v: string) => v.toLowerCase() === 'true'
    }[opts.type as string] || opts.type as Function)?.(process.env[key]) ?? opts.default
}), {}) as any

export default Resolved