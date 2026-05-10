import { getDesignTokens } from '../lib/theme';
import { useDesignProfileStore } from '../stores/designProfile';

export function useDesignTokens() {
  const profile = useDesignProfileStore((state) => state.profile);
  return getDesignTokens(profile);
}
