import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ChannelSelector } from 'presonus-studiolive-api-simple-api'

let configPath = join(__dirname, '../../map.json')

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
} = JSON.parse(readFileSync(configPath).toString('utf8'))

export default store
export function updateStore() {
    writeFileSync(configPath, JSON.stringify(store, null, 4), 'utf8')
}