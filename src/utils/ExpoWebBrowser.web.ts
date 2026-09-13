export function maybeCompleteAuthSession(): void {}

export async function openAuthSessionAsync(): Promise<{ type: 'dismiss' }> {
  return { type: 'dismiss' };
}
