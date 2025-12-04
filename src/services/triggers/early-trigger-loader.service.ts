// PRD Feature: SYNAPSE-V6
// Early trigger loader service - V6 simplified implementation

import { EventEmitter } from 'events';

export interface EarlyTriggerData {
  triggers: string[];
  confidence: number;
  loadedAt: string;
}

export interface EarlyTriggerEvent {
  data: {
    queries: string[];
    profileType: string;
    brandId: string;
  };
}

class EarlyTriggerLoaderService extends EventEmitter {
  constructor() {
    super();
  }

  async loadEarlyTriggers(brandProfile: any): Promise<EarlyTriggerData> {
    // V6 simplified implementation - returns placeholder data
    const data = {
      triggers: ['Trust', 'Authority', 'Scarcity'],
      confidence: 0.8,
      loadedAt: new Date().toISOString()
    };

    // Emit event for compatibility
    this.emit('queries-ready', {
      data: {
        queries: data.triggers,
        profileType: 'service_business',
        brandId: 'default-brand'
      }
    });

    return data;
  }

  async preloadTriggers(): Promise<void> {
    // V6 simplified implementation - no-op
    return;
  }

  reset(): void {
    // V6 simplified implementation - reset any internal state
    this.removeAllListeners();
  }

  // Callback registration methods for BrandContext compatibility
  onTargetCustomerAvailable(callback: (data: any) => void): void {
    this.on('target-customer-available', callback);
  }

  onProductsServicesAvailable(callback: (data: any) => void): void {
    this.on('products-services-available', callback);
  }

  onFullUVPAvailable(callback: (data: any) => void): void {
    this.on('full-uvp-available', callback);
  }
}

export const earlyTriggerLoaderService = new EarlyTriggerLoaderService();
