/**
 * MIT License
 *
 * Copyright (C) 2024 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import { wifiManager } from '@kit.ConnectivityKit';
import { connection } from '@kit.NetworkKit';
import Logger from './Logger';


export class RNNetworkInfoTurboModule extends TurboModule implements TM.NetworkInfoNativeModule.Spec {

  private TAG: string = "RNNetworkInfo";

  /**
   * 检查 WiFi 是否激活
   * @returns Promise<boolean> 返回 WiFi 是否激活
   */
  private isWifiActive(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        let isWifiActive = wifiManager.isWifiActive();
        Logger.info(this.TAG, "isWifiActive:" + isWifiActive);
        resolve(isWifiActive);
      }catch(error){
        Logger.error(this.TAG, "failed:" + JSON.stringify(error));
      }
    });
  }

  /**
   * 获取当前连接的 WiFi 的 SSID
   * @returns Promise<string | null> 返回 SSID 或 null（如果 WiFi 未激活或获取失败）
   */
  public async getSSID(): Promise<string | null> {
    if (!await this.isWifiActive()) {
      Logger.info(this.TAG, 'getSSID', 'WiFi not active');
      return null;
    }

    return new Promise((resolve) => {
      wifiManager.getLinkedInfo((err, data) => {
        if (err) {
          Logger.error(this.TAG, 'getSSID error', JSON.stringify(err));
          resolve(null);
          return;
        }
        let ssid = data.ssid;
        if (!ssid) {
          Logger.info(this.TAG, 'getSSID', 'SSID unknown');
          resolve(null);
          return;
        }
        // 移除 SSID 两端的引号（如果存在）
        if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
          ssid = ssid.substring(1, ssid.length - 1);
        }
        Logger.info(this.TAG, 'getSSID', ssid);
        resolve(ssid);
      });
    });
  }

  /**
   * 获取当前连接的 WiFi 的 BSSID
   * @returns Promise<string | null> 返回 BSSID 或 null（如果 WiFi 未激活或获取失败）
   */
  public async getBSSID(): Promise<string | null> {
    if (!await this.isWifiActive()) {
      Logger.info(this.TAG, 'getBSSID', 'WiFi not active');
      return null;
    }

    return new Promise((resolve) => {
      wifiManager.getLinkedInfo((err, data) => {
        if (err) {
          Logger.error(this.TAG, 'getBSSID error', JSON.stringify(err));
          resolve(null);
          return;
        }
        Logger.info(this.TAG, 'getBSSID', data.bssid);
        resolve(data.bssid);
      });
    });
  }

  /**
   * 获取当前网络的广播地址
   * @returns Promise<string | null> 返回广播地址或 null（如果 WiFi 未激活或获取失败）
   */
  public async getBroadcast(): Promise<string | null> {
    if (!await this.isWifiActive()) {
      Logger.info(this.TAG, 'getBroadcast', 'WiFi not active');
      return null;
    }

    try {
      let info = wifiManager.getIpInfo();
      let broadcastNum = this.calculateBroadcastAddress(info.ipAddress, info.netmask);
      let broadcastStr = this.convertIntToIp(broadcastNum);
      Logger.info(this.TAG, 'getBroadcast', broadcastStr);
      return broadcastStr;
    } catch (err) {
      Logger.error(this.TAG, 'getBroadcast error', JSON.stringify(err));
      return null;
    }
  }

  /**
   * 获取设备的 IP 地址
   * @returns Promise<string | null> 返回 IP 地址或 null（如果 WiFi 未激活或获取失败）
   */
  public async getIPAddress(): Promise<string | null> {
    if (!await this.isWifiActive()) {
      Logger.info(this.TAG, 'getIPAddress', 'WiFi not active');
      return null;
    }

    try {
      let info = wifiManager.getIpInfo();
      let ipAddress = this.convertIntToIp(info.ipAddress);
      Logger.info(this.TAG, 'getIPAddress', ipAddress);
      return ipAddress;
    } catch (err) {
      Logger.error(this.TAG, 'getIPAddress error', JSON.stringify(err));
      return null;
    }
  }

  /**
   * 获取设备的 IP 地址，优先使用wifi，其次使用蜂窝网络
   * @returns Promise<string | null> 返回 IPV4 地址
   */
  public getIPV4Address(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        this.getWIFIIPV4Address().then(address => {
          resolve(address);
        })
        this.getCellularIPV4Address().then(address => {
          resolve(address);
        })
      } catch (e) {
        reject(JSON.stringify(e));
      }
    })
  }

  /**
   * 获取设备wifi的 IPV4 地址
   * @returns Promise<string | null> 返回 WiFi的IPV4 地址
   */
  public async getWIFIIPV4Address(): Promise<string | null> {
    if (!await this.isWifiActive()) {
      Logger.info(this.TAG, 'getIPAddress', 'WiFi not active');
      return null;
    }

    const wifiProperties = this.getWifiNet();
    return this.getIPV4ByProerties(wifiProperties);
  }

  /**
   * 获取当前网络的子网掩码
   * @returns Promise<string | null> 返回子网掩码或 null（如果 WiFi 未激活或获取失败）
   */
  public async getSubnet(): Promise<string | null> {
    if (!await this.isWifiActive()) {
      Logger.info(this.TAG, 'getSubnet', 'WiFi not active');
      return null;
    }

    try {
      let info = wifiManager.getIpInfo();
      let subnet = this.convertIntToIp(info.netmask);
      Logger.info(this.TAG, 'getSubnet', subnet);
      return subnet;
    } catch (err) {
      Logger.error(this.TAG, 'getSubnet error', JSON.stringify(err));
      return null;
    }
  }

  /**
   * 获取网关 IP 地址
   * @returns Promise<string | null> 返回网关 IP 地址或 null（如果 WiFi 未激活或获取失败）
   */
  public async getGatewayIPAddress(): Promise<string | null> {
    if (!await this.isWifiActive()) {
      Logger.info(this.TAG, 'getGatewayIPAddress', 'WiFi not active');
      return null;
    }

    try {
      let info = wifiManager.getIpInfo();
      let ipAddress = this.convertIntToIp(info.gateway);
      Logger.info('getGatewayIPAddress', ipAddress);
      return ipAddress;
    } catch (err) {
      Logger.error(this.TAG, 'getGatewayIPAddress error', JSON.stringify(err));
      return null;
    }
  }

  /**
   * 获取当前 WiFi 的频率
   * @returns Promise<number | null> 返回频率或 null（如果 WiFi 未激活或获取失败）
   */
  public async getFrequency(): Promise<number | null> {
    if (!await this.isWifiActive()) {
      Logger.info('getFrequency', 'WiFi not active');
      return null;
    }

    return new Promise((resolve) => {
      wifiManager.getLinkedInfo((err, data) => {
        if (err) {
          Logger.error(this.TAG, 'getFrequency error', JSON.stringify(err));
          resolve(null);
          return;
        }
        Logger.info(this.TAG, 'getFrequency', JSON.stringify(data.frequency));
        resolve(data.frequency);
      });
    });
  }

  /*转换ip地址为点分十进制格式*/
  private convertIntToIp(intIp: number): string {
    // 确保输入是一个32位无符号整数
    intIp = intIp >>> 0;

    // 提取每个字节（8位）
    const octet1 = (intIp >> 24) & 255;
    const octet2 = (intIp >> 16) & 255;
    const octet3 = (intIp >> 8) & 255;
    const octet4 = intIp & 255;

    // 将四个字节组合成点分十进制格式
    return `${octet1}.${octet2}.${octet3}.${octet4}`;
  }

  /*计算广播地址*/
  private calculateBroadcastAddress(ipAddress: number, netmask: number): number {
    // 计算网络地址
    const networkAddress = ipAddress & netmask;
    // 计算广播地址
    const broadcastAddress = networkAddress | (~netmask);
    return broadcastAddress >>> 0; // 确保结果是无符号32位整数
  }

  private getCellularIPV4Address(): Promise<string | null> {
    const cellularProperties = this.getCellularNet();
    return this.getIPV4ByProerties(cellularProperties);
  }

  /*获取wifi网络*/
  private getWifiNet(): connection.ConnectionProperties {
    // 获取所有处于连接状态的网络列表
    const netHandles = connection.getAllNetsSync();
    const wifiNetHandle = netHandles.find(netHandle => {
      // 获取netHandle对应的网络的能力信息
      const netCapabilities = connection.getNetCapabilitiesSync(netHandle);
      return netCapabilities.bearerTypes.includes(connection.NetBearType.BEARER_WIFI);
    })
    // 获取netHandle对应的网络的连接信息
    const wifiConnectProperties = connection.getConnectionPropertiesSync(wifiNetHandle);
    return wifiConnectProperties;
  }

  /*获取蜂窝网络*/
  private getCellularNet(): connection.ConnectionProperties {
    const netHandles = connection.getAllNetsSync();
    const cellularNetHandle = netHandles.find(netHandle => {
      const netCapabilities = connection.getNetCapabilitiesSync(netHandle);
      return netCapabilities.bearerTypes.includes(connection.NetBearType.BEARER_CELLULAR);
    })
    // 获取netHandle对应的网络的连接信息
    const cellularConnectProperties = connection.getConnectionPropertiesSync(cellularNetHandle);
    return cellularConnectProperties;
  }

  /**
   * 获取ipv4地址
   * @param netProperties 网络连接信息
   * @returns Promise<string | null> 返回ipv4地址
   */
  private getIPV4ByProerties(netProperties: connection.ConnectionProperties): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try{
        // 筛选ipv4的地址
        const ipv4NetAddress = netProperties.linkAddresses.find(n => {
          return n.address.family === 1;
        })
        if(ipv4NetAddress){
          resolve(ipv4NetAddress?.address?.address);
        }else{
          resolve(null);
        }
      } catch (e) {
        reject(JSON.stringify(e));
      }
    })
  }
}