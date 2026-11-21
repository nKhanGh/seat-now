const tierDescriptions = ['Bình dân', 'Tầm trung', 'Cao', 'Rất cao'] as const;

export const PRICE_TIER_OPTIONS = tierDescriptions.map((description, index) => ({
  value: index + 1,
  label: `Mức ${index + 1} - ${description}`,
}));

export function priceTierLabel(tier: number): string {
  return tierDescriptions[tier - 1] ?? `Mức ${tier}`;
}
