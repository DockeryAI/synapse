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
  onTargetCustomerAvailable(customer: any, brandId: string, context: any): void {
    this.emit('target-customer-available', { customer, brandId, context });
  }

  onProductsServicesAvailable(products: any, customer?: any): void {
    this.emit('products-services-available', { products, customer });
  }

  onFullUVPAvailable(uvp: any, brandId: string): void {
    this.emit('full-uvp-available', { uvp, brandId });
  }
}

export const earlyTriggerLoaderService = new EarlyTriggerLoaderService();
