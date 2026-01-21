import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { getPermissions } from '@/lib/permissions';

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const permissions = getPermissions(session.user.role!);
  if (!permissions.canManageSettings) {
    redirect('/admin');
  }

  // Get current settings
  const settings = db.prepare('SELECT * FROM store_settings LIMIT 1').get() as any;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin" style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ marginTop: '8px', marginBottom: '4px' }}>Store Settings</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Configure your store information and preferences
        </p>
      </div>

      <form method="POST" action="/api/admin/settings/update" style={{ maxWidth: '600px' }}>
        {/* Store Information */}
        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Store Information</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Store Name
            </label>
            <input
              type="text"
              name="store_name"
              defaultValue={settings?.store_name || 'My Store'}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Store Logo URL
            </label>
            <input
              type="url"
              name="store_logo"
              defaultValue={settings?.store_logo || ''}
              placeholder="https://example.com/logo.png"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Optional: URL to your store logo image
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Currency
            </label>
            <select
              name="currency"
              defaultValue={settings?.currency || 'usd'}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="usd">USD - US Dollar</option>
              <option value="eur">EUR - Euro</option>
              <option value="gbp">GBP - British Pound</option>
              <option value="cad">CAD - Canadian Dollar</option>
              <option value="aud">AUD - Australian Dollar</option>
            </select>
          </div>

          <div style={{ marginBottom: '0' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Tax Rate (%)
            </label>
            <input
              type="number"
              name="tax_rate"
              defaultValue={settings?.tax_rate || 0}
              min="0"
              max="100"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Enter tax rate as a percentage (e.g., 8.5 for 8.5%)
            </p>
          </div>
        </div>

        {/* Inventory Settings */}
        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Inventory Settings</h2>
          
          <div style={{ marginBottom: '0' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Low Stock Threshold
            </label>
            <input
              type="number"
              name="low_stock_threshold"
              defaultValue={settings?.low_stock_threshold || 10}
              min="0"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Products with stock below this number will appear in low stock alerts
            </p>
          </div>
        </div>

        {/* Payment Configuration Info */}
        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '24px', background: '#f9fafb' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Payment Configuration</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            Payment settings are configured via environment variables:
          </p>
          <ul style={{ fontSize: '13px', color: '#666', paddingLeft: '20px', margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>STRIPE_SECRET_KEY</code> - Stripe API secret key
            </li>
            <li style={{ marginBottom: '8px' }}>
              <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> - Stripe publishable key
            </li>
          </ul>
        </div>

        {/* Shipping Info */}
        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '24px', background: '#f9fafb' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Shipping Configuration</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Shipping rules and carrier integration coming soon.
          </p>
          <p style={{ fontSize: '13px', color: '#999' }}>
            Currently, shipping addresses are collected during checkout.
          </p>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            style={{
              padding: '12px 32px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Save Settings
          </button>
          <Link
            href="/admin"
            style={{
              padding: '12px 32px',
              background: '#f5f5f5',
              color: '#666',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
