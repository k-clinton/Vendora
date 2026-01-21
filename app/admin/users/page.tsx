import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { getPermissions } from '@/lib/permissions';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; search?: string };
}) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const permissions = getPermissions(session.user.role!);
  if (!permissions.canManageUsers) {
    redirect('/admin');
  }

  const roleFilter = searchParams.role || 'all';
  const searchQuery = searchParams.search || '';

  // Build query
  let query = 'SELECT * FROM users WHERE 1=1';
  const params: any[] = [];

  if (roleFilter !== 'all') {
    query += ' AND role = ?';
    params.push(roleFilter.toUpperCase());
  }

  if (searchQuery) {
    query += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${searchQuery}%`, `%${searchQuery}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  const users = db.prepare(query).all(...params) as any[];

  // Get user counts by role
  const roleCounts = db.prepare(`
    SELECT role, COUNT(*) as count
    FROM users
    GROUP BY role
  `).all() as any[];

  const countsByRole: Record<string, number> = {};
  roleCounts.forEach((r) => {
    countsByRole[r.role] = r.count;
  });

  const allCount = roleCounts.reduce((sum, r) => sum + r.count, 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Link href="/admin" style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ marginTop: '8px', marginBottom: '4px' }}>User Management</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            View and manage registered users
          </p>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px'
      }}>
        {[
          { key: 'all', label: 'All', count: allCount },
          { key: 'admin', label: 'Admin', count: countsByRole.ADMIN || 0 },
          { key: 'staff', label: 'Staff', count: countsByRole.STAFF || 0 },
          { key: 'viewer', label: 'Viewer', count: countsByRole.VIEWER || 0 },
          { key: 'customer', label: 'Customer', count: countsByRole.CUSTOMER || 0 },
        ].map((tab) => {
          const isActive = roleFilter === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/users?role=${tab.key}`}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                background: isActive ? '#0070f3' : 'transparent',
                color: isActive ? 'white' : '#666',
                border: isActive ? 'none' : '1px solid #eee',
              }}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <form method="GET" style={{ display: 'flex', gap: '12px' }}>
          <input
            type="hidden"
            name="role"
            value={roleFilter}
          />
          <input
            type="text"
            name="search"
            placeholder="Search by name or email..."
            defaultValue={searchQuery}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
          {searchQuery && (
            <Link
              href={`/admin/users?role=${roleFilter}`}
              style={{
                padding: '10px 24px',
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
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div style={{ 
          padding: '60px 20px', 
          textAlign: 'center', 
          border: '1px solid #eee', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ marginBottom: '8px' }}>No users found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Joined</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const createdDate = new Date(user.created_at * 1000);
                const roleColors: Record<string, {bg: string, text: string}> = {
                  ADMIN: { bg: '#dbeafe', text: '#1e40af' },
                  STAFF: { bg: '#e0e7ff', text: '#4338ca' },
                  VIEWER: { bg: '#fef3c7', text: '#92400e' },
                  CUSTOMER: { bg: '#f3f4f6', text: '#374151' },
                };
                const colors = roleColors[user.role] || { bg: '#f3f4f6', text: '#374151' };

                return (
                  <tr key={user.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user.image ? (
                          <img 
                            src={user.image} 
                            alt={user.name || 'User'} 
                            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                          />
                        ) : (
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#6b7280'
                          }}>
                            {(user.name || user.email || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>
                            {user.name || 'No name'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{user.email}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: colors.bg,
                        color: colors.text,
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {user.disabled ? (
                        <span style={{
                          padding: '4px 10px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}>
                          DISABLED
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 10px',
                          background: '#d1fae5',
                          color: '#065f46',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                      {createdDate.toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Link
                        href={`/admin/users/${user.id}`}
                        style={{
                          padding: '6px 12px',
                          background: '#0070f3',
                          color: 'white',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {users.length > 0 && (
        <div style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
          Showing {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
