import type { ValuationJson } from './valuation.js';

export interface ItemWithDecision {
  valuationJson: ValuationJson | null;
  decision?: { decision: string } | null;
}
