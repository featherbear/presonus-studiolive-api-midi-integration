import easymidi from 'easymidi'
import type { ControlChange, Note } from 'easymidi'
import config, { NoteAction } from './config'
import type API from 'presonus-studiolive-api-simple-api'
import { parseChannelString } from 'presonus-studiolive-api/dist/lib/util/channelUtil'
import EventEmitter from 'events'
import type DeviceDescriptor from '../types/DeviceDescriptor'
import type DeviceBase from '../components/deviceProfiles/DeviceBase'
import type { Input, Output } from '../types/easymidiInterop'

export default (() => ({
    discover() {
        return easymidi.getInputs()
    },

    createVirtualPassthrough(name: string) {
        let inputDevice: Input = <Input>new easymidi.Input(name + '-virtual', true)
        let outputDevice: Output = <Output>new easymidi.Output(name + '-virtual', true)

        inputDevice.isPortOpen = () => true

        let lastTime = new Date()
        return [inputDevice, outputDevice, function simulateInput(bytes: number[]) {
            let currentTime = new Date()
            inputDevice._input.emit('message', (currentTime.getTime() - lastTime.getTime()) / 1000, bytes)
            lastTime = currentTime
        }] as const
    },

    connect(client: API, devices: DeviceDescriptor<DeviceBase>[]) {
        // let evtProxy_mute = new EventEmitter()
        // let evtProxy_level = new EventEmitter()
        // client.on('level', function (data) {
        //     evtProxy_level.emit(parseChannelString(data.channel), data.level)
        // })
        // client.on('mute', function (data) {
        //     evtProxy_mute.emit(parseChannelString(data.channel), data.status)
        // })

        devices.forEach((device) => {
            new device.profile(device.inputDevice, device.outputDevice, device.profileConfig)
        })



    }

}))()
