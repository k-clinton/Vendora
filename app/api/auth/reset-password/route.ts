import { NextResponse } from 'next/server';
import { db, dateToTimestamp } from '@/lib/db';
import { verifyPasswordResetToken, markPasswordResetTokenAsUsed } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Verify the token
    const result = verifyPasswordResetToken(token);

    if (!result.valid || !result.userId) {
      return NextResponse.json({ 
        error: 'Invalid or expired reset link. Please request a new one.' 
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    const now = dateToTimestamp(new Date());
    db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(
      hashedPassword,
      now,
      result.userId
    );

    // Mark token as used
    markPasswordResetTokenAsUsed(token);

    return NextResponse.json({ 
      success: true,
      message: 'Password reset successfully!' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
