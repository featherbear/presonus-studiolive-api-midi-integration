import type easymidi from 'easymidi'
import type DeviceBase from '../components/deviceProfiles/DeviceBase'
import type DeviceManager from './DeviceManager'
import type { Output } from './easymidiInterop'

export type InputDevice = string | easymidi.Input
export type OutputDevice = string | Output

export default interface DeviceDescriptor<T extends DeviceManager> {
    inputDevice: InputDevice
    outputDevice?: OutputDevice

    profile: new (...args: ConstructorParameters<typeof DeviceBase>) => T;
    profileConfig?: T['config']
}