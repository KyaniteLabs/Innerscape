export interface ValuationJson {
  estimated_low_usd?: number;
  estimated_high_usd?: number;
  confidence?: string;
  comp_count?: number;
  source?: string;
  label?: string;
}

export interface ListingDraftJson {
  title: string;
  description: string;
  condition: string;
  price_usd: number;
  category_hint: string;
  review_checklist: { id: string; label: string; done: boolean }[];
}
