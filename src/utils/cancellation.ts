/** Raw CLI / process stderr lines that indicate user cancellation (TR/EN). */
export function matchesCliUserCancellationMessage(message: string): boolean {
  return /cancelled|kullanici tarafindan|kullanıcı tarafından|iptal edildi/i.test(message);
}
