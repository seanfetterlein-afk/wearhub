// ─── Carrier options ─────────────────────────────────────────────────────────

export type ShippingCarrier = "DAO" | "GLS" | "Bring" | "PostNord";

export interface ShippingOption {
  carrier:       ShippingCarrier;
  methodType:    "pakkeshop" | "home";
  label:         string;
  description:   string;
  price:         number;  // DKK
  estimatedDays: string;
}

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    carrier:       "DAO",
    methodType:    "pakkeshop",
    label:         "DAO Pakkeshop",
    description:   "Leveres til nærmeste DAO pakkeshop",
    price:         39,
    estimatedDays: "1–3 hverdage",
  },
  {
    carrier:       "GLS",
    methodType:    "pakkeshop",
    label:         "GLS ParcelShop",
    description:   "Leveres til nærmeste GLS ParcelShop",
    price:         49,
    estimatedDays: "1–3 hverdage",
  },
  {
    carrier:       "Bring",
    methodType:    "home",
    label:         "Bring Hjemlevering",
    description:   "Leveres direkte til din adresse",
    price:         55,
    estimatedDays: "1–3 hverdage",
  },
  {
    carrier:       "PostNord",
    methodType:    "pakkeshop",
    label:         "PostNord Pakkeshop",
    description:   "Leveres til nærmeste PostNord udleveringssted",
    price:         39,
    estimatedDays: "1–4 hverdage",
  },
];

export function getShippingOption(carrier: ShippingCarrier): ShippingOption {
  return SHIPPING_OPTIONS.find((o) => o.carrier === carrier)!;
}

export function calculateShippingPrice(carrier: ShippingCarrier): number {
  return getShippingOption(carrier).price;
}

// Buyer protection fee: 3.5% of item price, minimum 10 kr
export function calculatePlatformFee(itemPrice: number): number {
  return Math.max(10, Math.round(itemPrice * 0.035));
}

// ─── Tracking URLs ────────────────────────────────────────────────────────────

export function getCarrierTrackingUrl(carrier: ShippingCarrier, trackingNumber: string): string {
  switch (carrier) {
    case "DAO":      return `https://tracking.dao.as/#!/${trackingNumber}`;
    case "GLS":      return `https://gls-group.com/DK/da/tracking?match=${trackingNumber}`;
    case "Bring":    return `https://tracking.bring.com/tracking/api/fetch?lang=da&q=${trackingNumber}`;
    case "PostNord": return `https://tracking.postnord.com/dk/?id=${trackingNumber}`;
  }
}

// ─── Label creation ───────────────────────────────────────────────────────────

export interface CreateLabelInput {
  orderId:          string;
  carrier:          ShippingCarrier;
  methodType:       "pakkeshop" | "home";
  recipientName:    string;
  recipientAddress: string;
  recipientCity:    string;
  recipientZip:     string;
}

export interface ShippingLabel {
  trackingNumber: string;
  trackingUrl:    string;
  labelUrl:       string;
  packageCode:    string;
}

/**
 * Creates a shipping label.
 *
 * MOCK IMPLEMENTATION — replace body with real carrier API call, e.g.:
 *   const res = await fetch("https://api.shipmondo.com/v3/shipments", {
 *     method: "POST",
 *     headers: { Authorization: `Basic ${btoa(apiKey + ":")}` },
 *     body: JSON.stringify({ carrier, recipient: { ... } }),
 *   });
 *   const data = await res.json();
 *   return { trackingNumber: data.tracking_number, ... };
 */
export async function createShippingLabel(input: CreateLabelInput): Promise<ShippingLabel> {
  const trackingNumber = `WH${Date.now().toString().slice(-9)}`;
  const packageCode    = trackingNumber.slice(-6).toUpperCase();
  const trackingUrl    = getCarrierTrackingUrl(input.carrier, trackingNumber);
  const labelUrl       = `/api/shipping/label/${input.orderId}`;

  return { trackingNumber, trackingUrl, labelUrl, packageCode };
}

// ─── Tracking status ──────────────────────────────────────────────────────────

export interface TrackingEvent {
  timestamp:   string;
  description: string;
  location:    string;
}

export interface TrackingInfo {
  status:            string;
  location:          string;
  estimatedDelivery: string;
  events:            TrackingEvent[];
}

/**
 * Fetches live tracking info from carrier.
 *
 * MOCK — replace with real carrier tracking API.
 */
export async function getTrackingInfo(
  _carrier: ShippingCarrier,
  _trackingNumber: string,
): Promise<TrackingInfo> {
  return {
    status:            "in_transit",
    location:          "Sorteringsanlæg, Danmark",
    estimatedDelivery: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    events:            [],
  };
}

/**
 * Polls carrier tracking and updates the shipment record in Supabase.
 * Intended to be called from a cron job.
 *
 * STUB — implement when integrating a real carrier API.
 */
export async function updateShipmentStatus(_orderId: string): Promise<void> {
  // TODO: poll getTrackingInfo(), update shipments table, fire notifications
}
