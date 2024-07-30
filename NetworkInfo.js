"use strict";

import { NativeModules, Platform, TurboModuleRegistry } from "react-native";

const NetworkInfoNativeModule = TurboModuleRegistry ? TurboModuleRegistry.get('NetworkInfoNativeModule') : NativeModules.NetworkInfoNativeModule

const NetworkInfo = {
  async getSSID() {
    return await NetworkInfoNativeModule.getSSID();
  },

  async getBSSID() {
    return await NetworkInfoNativeModule.getBSSID();
  },

  async getBroadcast() {
    return await NetworkInfoNativeModule.getBroadcast();
  },

  async getIPAddress() {
    return await NetworkInfoNativeModule.getIPAddress();
  },

  async getIPV4Address() {
    const wifiIP = await NetworkInfoNativeModule.getWIFIIPV4Address();
    if (wifiIP && wifiIP !== '0.0.0.0') {
      return wifiIP;
    }
    
    return await NetworkInfoNativeModule.getIPV4Address();
  },

  async getGatewayIPAddress() {
    return await NetworkInfoNativeModule.getGatewayIPAddress();
  },

  async getSubnet() {
    return await NetworkInfoNativeModule.getSubnet();
  },

  async getFrequency() {
    if (Platform.OS === 'android' || Platform.OS === 'harmony') {
      return await NetworkInfoNativeModule.getFrequency();
    }
    return null;
  }
};

module.exports = { NetworkInfo };
