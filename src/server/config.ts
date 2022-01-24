import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { ChannelSelector } from 'presonus-studiolive-api-simple-api'
import { path } from 'app-root-path'

let configPath = join(path, 'map.json')

export type NoteAction = 'mute' | 'unmute'

const store: {
    controllers: {
        [controllerID: string]: {
            type: 'volume' | 'pan'
            selector: ChannelSelector
        }
    },
    notes: {
        [noteID: string]: {
            latch?: boolean
            onPress: NoteAction
            onRelease?: NoteAction | null
            selector: ChannelSelector
        }
    }
} = (existsSync(configPath) && JSON.parse(readFileSync(configPath).toString('utf8')))
    || { controllers: {}, notes: {} }


export default store
export function updateStore(data?: Object) {
    if (data) Object.assign(store, data)
    writeFileSync(configPath, JSON.stringify(store, null, 4), 'utf8')
}