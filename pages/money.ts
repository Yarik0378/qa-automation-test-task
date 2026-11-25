/** Extracts the amount from strings like "$29.99" or "Item total: $39.98". */
export function parseMoney(text: string): number {
  const match = text.match(/\$(\d+(?:\.\d+)?)/);
  if (!match?.[1]) throw new Error(`No dollar amount in "${text}"`);
  return Number(match[1]);
}

export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
