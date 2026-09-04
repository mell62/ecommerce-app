export function redirectToStripeCheckout(checkoutUrl: string): void {
  window.location.assign(checkoutUrl);
}
