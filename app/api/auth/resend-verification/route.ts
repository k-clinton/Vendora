import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateEmailVerificationToken, sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists, a verification email will be sent.' 
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    // Generate new token and send email
    const token = generateEmailVerificationToken(user.id);
    await sendVerificationEmail(email, token);

    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent!' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to resend verification email' }, { status: 500 });
  }
}
