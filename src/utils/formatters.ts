export const formatCurrency = (amount: number): string => {
  return `LKR ${amount.toLocaleString()}`;
};

export const formatDistance = (km: number): string => {
  return `${km.toFixed(1)} km away`;
};

export const formatPercentage = (numerator: number, denominator: number): number => {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
};
