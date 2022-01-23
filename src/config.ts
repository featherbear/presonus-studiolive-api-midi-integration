import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ChannelSelector } from 'presonus-studiolive-api-simple-api'
import { ControllerType, NoteAction } from './types/configTypes'

let configPath = join(__dirname, '../map.json')

const store: {
    controllers: {
        [controllerID: string]: {
            type: typeof ControllerType[number]
            selector: ChannelSelector
        }
    },
    notes: {
        [noteID: string]: {
            latch?: boolean
            onPress: typeof NoteAction[number]
            onRelease?: typeof NoteAction[number] | null
            selector: ChannelSelector
        }
    }
} = JSON.parse(readFileSync(configPath).toString('utf8'))

export default store
export function updateStore() {
    writeFileSync(configPath, JSON.stringify(store, null, 4), 'utf8')
}