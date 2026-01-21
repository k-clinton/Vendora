import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatePasswordResetToken, sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    
    // Always return success to avoid revealing if user exists
    if (!user) {
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    }

    // Generate reset token and send email
    const token = generatePasswordResetToken(user.id);
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ 
      success: true,
      message: 'Password reset link sent to your email!' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
