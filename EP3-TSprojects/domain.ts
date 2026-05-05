export type DeviceType = "MacBook" | "iPhone" | "iPad";

export interface User{
    name: string;
    age: number;
    device: DeviceType;
}