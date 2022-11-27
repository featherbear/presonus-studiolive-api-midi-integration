import type easymidi from 'easymidi'
import type { Output } from './easymidiInterop'
import type DeviceBase from '../components/deviceProfiles/DeviceBase'

export type InputDevice = string | easymidi.Input
export type OutputDevice = string | Output

export default interface DeviceDescriptor<T extends DeviceBase> {
    inputDevice: InputDevice
    outputDevice?: OutputDevice

    profile: new (...args: ConstructorParameters<typeof DeviceBase>) => T;
    profileConfig?: T['config']
}