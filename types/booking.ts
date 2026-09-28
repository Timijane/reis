export type ProductType = 'rental' | 'tent' | 'service';
export type BookingStatus =
  | 'pending_review'
  | 'awaiting_customer'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'paid'
  | 'in_fulfilment'
  | 'completed';
export type ReservationStatus = 'none' | 'held' | 'confirmed' | 'expired';
export type PaymentStatus = 'unpaid' | 'pending' | 'partially_paid' | 'paid' | 'failed' | 'refunded';
export type InventoryMode = 'admin_confirmed' | 'quantity_controlled' | 'enquiry';
export type FulfilmentStatus = 'not_scheduled' | 'scheduled' | 'out_for_delivery' | 'delivered' | 'collected' | 'returned' | 'completed';
export type DepositStatus = 'not_required' | 'required' | 'authorised' | 'held' | 'partially_refunded' | 'refunded';

export interface ProductPromotion {
  type: 'percent' | 'fixed' | 'sale_price';
  value: number;
  startsAt?: string;
  endsAt?: string;
  code?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  categoryId?: string;
  description: string;
  image?: string;
  images?: string[];
  active: boolean;
  featured?: boolean;
  premium?: boolean;
  promo?: ProductPromotion;
  price: number;
  currency: 'GBP';
  minimumQuantity?: number;
  maximumQuantity?: number;
  inventoryMode: InventoryMode;
  quantityAvailable?: number;
  rentalDuration?: { minDays: number; maxDays?: number };
  dimensions?: string;
  capacity?: string;
  siteInspectionRequired?: boolean;
  customerPhotosRequired?: boolean;
  customSizeAllowed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  type: ProductType;
  quantity: number;
  unitPrice: number;
  promoDiscount: number;
  total: number;
  eventDate: string;
  endDate?: string;
  durationDays: number;
  image?: string;
  tentSize?: string;
}

export interface SiteDetails {
  photos: string[];
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  knowsTentSize: boolean;
  notes?: string;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
}

export interface EventDetails {
  date: string;
  endDate?: string;
  eventType: string;
  venue: string;
  postcode?: string;
  guestCount?: number;
}

export interface PricingSnapshot {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  setupFee: number;
  deposit: number;
  tax: number;
  total: number;
  currency: 'GBP';
  quoteVersion: number;
}

export interface Booking {
  id: string;
  reference: string;
  paymentCode?: string;
  customer: Customer;
  event: EventDetails;
  items: CartItem[];
  productIds: string[];
  site?: SiteDetails;
  serviceDescription?: string;
  servicePhotos?: string[];
  pricing: PricingSnapshot;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: BookingStatus;
  reservationStatus: ReservationStatus;
  paymentStatus: PaymentStatus;
  fulfilmentStatus: FulfilmentStatus;
  depositStatus: DepositStatus;
  holdExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
  acceptedQuoteVersion?: number;
}
