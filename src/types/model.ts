export enum Currency {
  USD = 'USD',
  CNY = 'CNY',
}

export interface PriceTier {
  label: string;
  inputPrice: number;
  outputPrice: number;
  cachedInputPrice?: number;
  cachedOutputPrice?: number;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  inputPrice?: number;
  outputPrice?: number;
  cachedInputPrice?: number;
  cachedOutputPrice?: number;
  pricingTiers?: PriceTier[];
  billingCurrency: Currency;
}

export interface ModelsData {
  updatedAt: number;
  models: Model[];
}
