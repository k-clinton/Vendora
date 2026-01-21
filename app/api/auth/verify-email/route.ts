import { NextResponse } from 'next/server';
import { db, dateToTimestamp } from '@/lib/db';
import { verifyEmailToken } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify the token
    const result = verifyEmailToken(token);

    if (!result.valid || !result.userId) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification link. Please request a new one.' 
      }, { status: 400 });
    }

    // Update user's email_verified status
    const now = dateToTimestamp(new Date());
    db.prepare('UPDATE users SET email_verified = ?, updated_at = ? WHERE id = ?').run(
      1,
      now,
      result.userId
    );

    return NextResponse.json({ 
      success: true,
      message: 'Email verified successfully!' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
