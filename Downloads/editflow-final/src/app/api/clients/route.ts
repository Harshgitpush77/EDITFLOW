import { NextResponse } from "next/server";

import { loadStore, saveStore } from "@/lib/data-store";

export async function GET() {
  const store = await loadStore();
  return NextResponse.json(store.clients);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const store = await loadStore();
  const email = String(payload.email || "").trim().toLowerCase();
  const duplicate = store.clients.some((client) => client.email.toLowerCase() === email);
  if (duplicate) {
    return NextResponse.json({ error: "Client already exists" }, { status: 409 });
  }
  const client = {
    id: crypto.randomUUID(),
    name: payload.name || "",
    companyName: payload.companyName || "",
    email,
    phone: payload.phone || "",
    billingAddress: payload.billingAddress || "",
    createdAt: new Date().toISOString(),
  };
  store.clients.unshift(client);
  await saveStore(store);
  return NextResponse.json(client);
}
