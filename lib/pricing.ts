import type { Product } from '@/types/booking';

export function activePromo(product: Product, now = new Date()) {
  const promo = product.promo;
  if (!promo) return null;
  const time = now.getTime();
  if (promo.startsAt && time < new Date(promo.startsAt).getTime()) return null;
  if (promo.endsAt && time > new Date(promo.endsAt).getTime()) return null;
  return promo;
}

export function unitPrice(product: Product, now = new Date()) {
  const promo = activePromo(product, now);
  if (!promo) return product.price;
  if (promo.type === 'sale_price') return Math.max(0, promo.value);
  if (promo.type === 'percent') return Math.max(0, product.price - product.price * promo.value / 100);
  return Math.max(0, product.price - promo.value);
}

export function validateQuantity(product: Product, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Invalid quantity for ${product.name}.`);
  if (product.minimumQuantity && quantity < product.minimumQuantity) {
    throw new Error(`${product.name} requires a minimum quantity of ${product.minimumQuantity}.`);
  }
  if (product.maximumQuantity && quantity > product.maximumQuantity) {
    throw new Error(`${product.name} allows a maximum quantity of ${product.maximumQuantity}.`);
  }
}

export function calculate(items: { product: Product; quantity: number }[], deliveryFee = 0, setupFee = 0, deposit = 0, tax = 0) {
  let subtotal = 0;
  let discount = 0;
  for (const { product, quantity } of items) {
    validateQuantity(product, quantity);
    const normal = product.price * quantity;
    const sale = unitPrice(product) * quantity;
    subtotal += normal;
    discount += normal - sale;
  }
  const total = Math.max(0, subtotal - discount) + deliveryFee + setupFee + tax;
  return {
    subtotal,
    discount,
    deliveryFee,
    setupFee,
    deposit,
    tax,
    total,
    currency: 'GBP' as const,
  };
}
