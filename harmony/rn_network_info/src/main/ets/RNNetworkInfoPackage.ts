/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import type { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { RNPackage, TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import { RNNetworkInfoTurboModule } from './RNNetworkInfoTurboModule';

class RNNetworkInfoTurboModuleFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (this.hasTurboModule(name)) {
      return new RNNetworkInfoTurboModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === TM.NetworkInfoNativeModule.NAME;
  }
}

export class RNNetworkInfoPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new RNNetworkInfoTurboModuleFactory(ctx);
  }
}