import nodemailer from "nodemailer";
import { db, generateId, dateToTimestamp } from "./sqlite";

// Email service configuration
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  // If SMTP is configured, send real email
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    console.log(`Attempting to send email via SMTP to: ${options.to}`);
    console.log(
      `SMTP Config: Host=${SMTP_HOST}, Port=${SMTP_PORT}, User=${SMTP_USER}, Secure=${Number(SMTP_PORT) === 465}`,
    );

    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: SMTP_FROM || '"Vendora" <noreply@vendora.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`✓ Email sent successfully. Message ID: ${info.messageId}`);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return { success: false, error };
    }
  } else {
    console.warn(
      "SMTP settings missing. SMTP_HOST:",
      !!SMTP_HOST,
      "SMTP_USER:",
      !!SMTP_USER,
      "SMTP_PASS:",
      !!SMTP_PASS,
    );
  }

  // Fallback for development/testing if no SMTP configured
  if (process.env.NODE_ENV === "development") {
    console.log("\n📧 Email sent (development mode - no SMTP configured):");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("Body:", options.text || options.html);
    console.log("---\n");
    return { success: true };
  }

  // Placeholder for production without SMTP
  console.warn(
    "Email service not configured. Email would be sent to:",
    options.to,
  );
  return { success: true };
}

// Generate email verification token
export function generateEmailVerificationToken(userId: string): string {
  // Delete any existing tokens for this user
  db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(
    userId,
  );

  const token = generateRandomToken();
  const expiresAt = dateToTimestamp(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours
  const now = dateToTimestamp(new Date());

  db.prepare(
    `
    INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(generateId(), userId, token, expiresAt, now);

  return token;
}

// Generate password reset token
export function generatePasswordResetToken(userId: string): string {
  // Delete any existing unused tokens for this user
  db.prepare(
    "DELETE FROM password_reset_tokens WHERE user_id = ? AND used = 0",
  ).run(userId);

  const token = generateRandomToken();
  const expiresAt = dateToTimestamp(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour
  const now = dateToTimestamp(new Date());

  db.prepare(
    `
    INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(generateId(), userId, token, expiresAt, 0, now);

  return token;
}

// Verify email verification token
export function verifyEmailToken(token: string): {
  valid: boolean;
  userId?: string;
} {
  const now = dateToTimestamp(new Date());

  const record = db
    .prepare(
      `
    SELECT user_id FROM email_verification_tokens 
    WHERE token = ? AND expires_at > ?
  `,
    )
    .get(token, now) as any;

  if (!record) {
    return { valid: false };
  }

  // Delete the token after use
  db.prepare("DELETE FROM email_verification_tokens WHERE token = ?").run(
    token,
  );

  return { valid: true, userId: record.user_id };
}

// Verify password reset token
export function verifyPasswordResetToken(token: string): {
  valid: boolean;
  userId?: string;
} {
  const now = dateToTimestamp(new Date());

  const record = db
    .prepare(
      `
    SELECT user_id FROM password_reset_tokens 
    WHERE token = ? AND expires_at > ? AND used = 0
  `,
    )
    .get(token, now) as any;

  if (!record) {
    return { valid: false };
  }

  return { valid: true, userId: record.user_id };
}

// Mark password reset token as used
export function markPasswordResetTokenAsUsed(token: string) {
  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?").run(
    token,
  );
}

// Send email verification email
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Verify Your Email</h1>
      <p style="color: #666; font-size: 16px;">
        Thank you for registering! Please click the button below to verify your email address.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background: #0070f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
          Verify Email
        </a>
      </div>
      <p style="color: #999; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #0070f3;">${verificationUrl}</a>
      </p>
      <p style="color: #999; font-size: 14px;">
        This link will expire in 24 hours.
      </p>
    </div>
  `;

  const text = `Verify Your Email\n\nPlease visit this link to verify your email address:\n${verificationUrl}\n\nThis link will expire in 24 hours.`;

  return sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    html,
    text,
  });
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
      <p style="color: #666; font-size: 16px;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background: #0070f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
          Reset Password
        </a>
      </div>
      <p style="color: #999; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #0070f3;">${resetUrl}</a>
      </p>
      <p style="color: #999; font-size: 14px;">
        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = `Reset Your Password\n\nPlease visit this link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.`;

  return sendEmail({
    to: email,
    subject: "Reset Your Password",
    html,
    text,
  });
}

// Helper to generate random token
function generateRandomToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
