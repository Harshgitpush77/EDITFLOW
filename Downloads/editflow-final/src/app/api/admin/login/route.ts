import { NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@editflow.io";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inputEmail = (body.email || "").trim().toLowerCase();
    const inputPassword = body.password || "";

    const expectedEmail = ADMIN_EMAIL.trim().toLowerCase();

    // Check credentials
    const passwordMatches =
      inputPassword === ADMIN_PASSWORD ||
      (ADMIN_PASSWORD === "admin123" && inputPassword === "admin");

    if (inputEmail === expectedEmail && passwordMatches) {
      return NextResponse.json({ success: true, email: ADMIN_EMAIL });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid email or password.",
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request payload." },
      { status: 400 }
    );
  }
}
