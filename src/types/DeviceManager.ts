import type { Client } from "presonus-studiolive-api-simple-api";
import type DeviceBase from "../components/deviceProfiles/DeviceBase";

export default interface DeviceManager extends DeviceBase {
    setAPI(api: Client)
}