"use server";

import { demoMenu } from "@/lib/data/demo-menu";
import { getSupabase } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true; demo: boolean; summary: string }
  | { ok: false; error: string };

interface OrderInput {
  lines: Array<{ id: string; qty: number }>;
  seating: "table" | "floor";
  tableLabel?: string;
  name?: string;
  note?: string;
}

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : "";

/**
 * Prices and names are always re-read on the server — the browser only says
 * "which items, how many". Without Supabase credentials this validates against
 * the demo menu and reports `demo: true` so the UI can say nothing was sent.
 */
export async function createOrder(input: OrderInput): Promise<ActionResult> {
  if (!Array.isArray(input?.lines) || input.lines.length === 0 || input.lines.length > 60) {
    return { ok: false, error: "الطلب فاضي." };
  }
  const seating = input.seating === "floor" ? "floor" : "table";
  const supabase = getSupabase();

  type Row = { id: string; name_ar: string; price: number | null; is_available: boolean };
  let rows: Row[];
  if (supabase) {
    const ids = input.lines.map((l) => l.id);
    const { data, error } = await supabase
      .from("menu_items")
      .select("id,name_ar,price,is_available")
      .in("id", ids);
    if (error || !data) return { ok: false, error: "حصلت مشكلة في الاتصال. جرّب تاني." };
    rows = (data as Array<{ id: string; name_ar: string; price: number | string | null; is_available: boolean }>).map(
      (r) => ({ ...r, price: r.price === null ? null : Number(r.price) }),
    );
  } else {
    rows = demoMenu
      .flatMap((c) => c.items)
      .map((i) => ({ id: i.id, name_ar: i.nameAr, price: i.price, is_available: i.isAvailable }));
  }
  const byId = new Map(rows.map((r) => [r.id, r]));

  const items: Array<{ id: string; name: string; qty: number; price: number }> = [];
  let total = 0;
  for (const l of input.lines) {
    const r = byId.get(l.id);
    const qty = Math.floor(Number(l.qty));
    if (!r || !r.is_available || !(qty >= 1 && qty <= 20)) {
      return { ok: false, error: "في صنف مش متاح دلوقتي. راجع الطلب." };
    }
    if (r.price === null) return { ok: false, error: `سعر «${r.name_ar}» لسه مش معلن.` };
    items.push({ id: r.id, name: r.name_ar, qty, price: r.price });
    total += r.price * qty;
  }

  const summary = `${items.reduce((n, i) => n + i.qty, 0)} صنف · ${total} ج.م`;
  if (!supabase) return { ok: true, demo: true, summary };

  const { error } = await supabase.from("orders").insert({
    items,
    total,
    seating,
    table_label: clean(input.tableLabel, 20) || null,
    customer_name: clean(input.name, 60) || null,
    note: clean(input.note, 300) || null,
  });
  if (error) return { ok: false, error: "الطلب ماتبعتش. جرّب تاني." };
  return { ok: true, demo: false, summary };
}

interface ReservationInput {
  name: string;
  phone: string;
  partySize: number;
  seating: "table" | "floor" | "any";
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  note?: string;
}

export async function createReservation(input: ReservationInput): Promise<ActionResult> {
  const name = clean(input?.name, 60);
  const phone = clean(input?.phone, 20);
  const partySize = Math.floor(Number(input?.partySize));
  const seating = ["table", "floor", "any"].includes(input?.seating) ? input.seating : "any";
  if (!name) return { ok: false, error: "اكتب اسمك." };
  if (!/^[0-9+ ]{7,20}$/.test(phone)) return { ok: false, error: "رقم التليفون مش مظبوط." };
  if (!(partySize >= 1 && partySize <= 40)) return { ok: false, error: "عدد الأفراد من ١ لـ ٤٠." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input?.date ?? "") || !/^\d{2}:\d{2}$/.test(input?.time ?? "")) {
    return { ok: false, error: "اختار اليوم والمعاد." };
  }
  const when = new Date(`${input.date}T${input.time}:00`);
  if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() - 60_000) {
    return { ok: false, error: "المعاد ده عدّى. اختار معاد جاي." };
  }

  const seatLabel = { table: "ترابيزة", floor: "على الأرض", any: "أي مكان" }[seating];
  const summary = `${partySize} أفراد · ${seatLabel} · ${input.date} ${input.time}`;

  const supabase = getSupabase();
  if (!supabase) return { ok: true, demo: true, summary };

  const { error } = await supabase.from("reservations").insert({
    name,
    phone,
    party_size: partySize,
    seating,
    reserved_for: when.toISOString(),
    note: clean(input.note, 300) || null,
  });
  if (error) return { ok: false, error: "الحجز ماتبعتش. جرّب تاني." };
  return { ok: true, demo: false, summary };
}
