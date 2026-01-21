import { NextResponse } from "next/server";
import { db, generateId, dateToTimestamp } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateEmailVerificationToken, sendVerificationEmail } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = generateId();
    const now = dateToTimestamp(new Date());

    // Create user with email_verified = 0
    db.prepare(
      `
      INSERT INTO users (id, name, email, email_verified, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'CUSTOMER', ?, ?)
    `,
    ).run(id, name, email, 0, hashedPassword, now, now);

    // Generate verification token and send email
    const token = generateEmailVerificationToken(id);
    await sendVerificationEmail(email, token);

    return NextResponse.json({ 
      success: true,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
