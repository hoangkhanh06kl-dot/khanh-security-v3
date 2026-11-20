import { Capacitor, registerPlugin } from "@capacitor/core";
export const nativeAndroid = Capacitor.getPlatform() === "android";
export const CallProtection = registerPlugin("CallProtection");
