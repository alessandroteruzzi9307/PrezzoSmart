export interface Offer {
  store: string;
  price: number;
  currency: string;
  link?: string; // Extracted URL or inferred homepage
  description?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ProductData {
  productName: string;
  imageUrl?: string; // URL dell'immagine del prodotto
  bestPrice: number;
  averagePrice: number;
  offers: Offer[];
  lastUpdated: string;
  sources: GroundingSource[]; // URLs from Gemini Grounding
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}