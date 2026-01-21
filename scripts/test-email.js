const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Simple .env parser since dotenv might not be installed
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log('❌ No .env file found at:', envPath);
      return {};
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[match[1].trim()] = value;
      }
    });
    return env;
  } catch (e) {
    console.error('Error loading .env:', e);
    return {};
  }
}

async function main() {
  const env = loadEnv();
  
  // Also check process.env in case they are set there
  const SMTP_HOST = env.SMTP_HOST || process.env.SMTP_HOST;
  const SMTP_PORT = env.SMTP_PORT || process.env.SMTP_PORT;
  const SMTP_USER = env.SMTP_USER || process.env.SMTP_USER;
  const SMTP_PASS = env.SMTP_PASS || process.env.SMTP_PASS;
  const SMTP_FROM = env.SMTP_FROM || process.env.SMTP_FROM;

  console.log('--- Email Debugger ---');
  console.log('Checking configuration...');
  console.log('SMTP_HOST:', SMTP_HOST ? '✅ Found' : '❌ Missing');
  console.log('SMTP_PORT:', SMTP_PORT ? `✅ Found (${SMTP_PORT})` : '❌ Missing');
  console.log('SMTP_USER:', SMTP_USER ? '✅ Found' : '❌ Missing');
  console.log('SMTP_PASS:', SMTP_PASS ? '✅ Found (hidden)' : '❌ Missing');
  console.log('SMTP_FROM:', SMTP_FROM ? `✅ Found (${SMTP_FROM})` : '⚠️ Missing (Will use default)');

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('\n❌ Critical: Missing required SMTP configuration.');
    console.log('Please check your .env file and ensure these variables are set.');
    process.exit(1);
  }

  console.log('\nAttempting to connect and send test email...');
  
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465, 
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Verify connection first
    await transporter.verify();
    console.log('✅ SMTP Connection established successfully.');

    const info = await transporter.sendMail({
      from: SMTP_FROM || '"Test" <noreply@vendora.com>',
      to: SMTP_USER, // Send to self to test
      subject: 'Vendora SMTP Test',
      text: 'If you receive this, your email configuration is correct!',
      html: '<h1>SMTP Test</h1><p>If you receive this, your email configuration is correct!</p>',
    });

    console.log(`\n✅ Test email sent successfully!`);
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Check inbox for: ${SMTP_USER}`);

  } catch (error) {
    console.error('\n❌ Email sending failed!');
    console.error('Error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('Hint: Authentication failed. Check your email and password.');
      console.error('Note: If using Gmail, you need an App Password, not your login password.');
    }
  }
}

main();
