import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });

  const admin = createServiceClient();

  // Fetch order + shipment
  const { data: order } = await admin
    .from("orders")
    .select("id, buyer_id, seller_id, buyer_name, buyer_address, buyer_city, buyer_zip, shipping_carrier, shipping_method")
    .eq("id", orderId)
    .single();

  if (!order) return NextResponse.json({ error: "Ordre ikke fundet." }, { status: 404 });
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return NextResponse.json({ error: "Ikke autoriseret." }, { status: 403 });
  }

  const { data: shipment } = await admin
    .from("shipments")
    .select("tracking_number, package_code, carrier, shipping_method, created_at")
    .eq("order_id", orderId)
    .single();

  if (!shipment) return NextResponse.json({ error: "Fragtlabel ikke fundet." }, { status: 404 });

  // Render a printable HTML label
  const html = `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8" />
  <title>Fragtlabel — Nord Studios</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: monospace; background: #fff; color: #000; padding: 32px; }
    .label {
      border: 2px solid #000;
      max-width: 420px;
      margin: 0 auto;
      padding: 24px;
    }
    .logo { font-size: 22px; font-weight: bold; letter-spacing: 0.15em; margin-bottom: 20px; }
    .carrier { font-size: 28px; font-weight: bold; border: 2px solid #000; display: inline-block; padding: 6px 14px; margin-bottom: 20px; }
    h2 { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #888; margin-bottom: 4px; }
    p  { font-size: 14px; margin-bottom: 16px; line-height: 1.5; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 0.1em; border: 2px dashed #000; padding: 12px 16px; text-align: center; margin-bottom: 20px; }
    .divider { border-top: 1px solid #ccc; margin: 16px 0; }
    .footer { font-size: 9px; color: #aaa; text-align: center; margin-top: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
<div class="label">
  <div class="logo">NORD STUDIOS</div>
  <div class="carrier">${shipment.carrier}</div>

  <h2>Leveringsadresse</h2>
  <p>
    ${(order as any).buyer_name ?? "—"}<br/>
    ${(order as any).buyer_address ?? "—"}<br/>
    ${(order as any).buyer_zip ?? ""} ${(order as any).buyer_city ?? ""}
  </p>

  <h2>Fragtmetode</h2>
  <p>${shipment.shipping_method === "pakkeshop" ? "Pakkeshop" : "Hjemlevering"}</p>

  <div class="divider"></div>

  <h2>Pakkekode / Trackingnummer</h2>
  <div class="code">${shipment.package_code ?? shipment.tracking_number}</div>

  <h2>Trackingnummer</h2>
  <p>${shipment.tracking_number}</p>

  <div class="divider"></div>

  <p style="font-size:11px; color:#555;">
    Aflever pakken hos din nærmeste ${shipment.carrier} ${
      shipment.shipping_method === "pakkeshop" ? "pakkeshop" : "indleveringssted"
    } med denne kode.
  </p>

  <div class="footer">
    Oprettet ${new Date(shipment.created_at).toLocaleDateString("da-DK")} · Nord Studios.dk
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
