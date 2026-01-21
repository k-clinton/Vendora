'use client';

import { useState } from 'react';

interface AdminUserActionsProps {
  userId: string;
  userRole: string;
  userDisabled: boolean;
  canBanUsers: boolean;
}

export function AdminUserActions({ userId, userRole, userDisabled, canBanUsers }: AdminUserActionsProps) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Actions</h3>
      
      {/* Change Role */}
      {canBanUsers && (
        <form method="POST" action={`/api/admin/users/${userId}/change-role`} style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>
            Change Role
          </label>
          <select 
            name="role"
            defaultValue={userRole}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '8px',
            }}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="VIEWER">Viewer</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Update Role
          </button>
        </form>
      )}

      {/* Disable/Enable User */}
      {canBanUsers && (
        <form 
          method="POST" 
          action={`/api/admin/users/${userId}/${userDisabled ? 'enable' : 'disable'}`}
          onSubmit={(e) => {
            const action = userDisabled ? 'enable' : 'disable';
            if (!confirm(`Are you sure you want to ${action} this user?`)) {
              e.preventDefault();
            }
          }}
        >
          {!userDisabled && (
            <textarea
              name="reason"
              placeholder="Reason for disabling (optional)"
              rows={2}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '8px',
                resize: 'vertical',
              }}
            />
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              background: userDisabled ? '#10b981' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {userDisabled ? 'Enable User' : 'Disable User'}
          </button>
        </form>
      )}
    </div>
  );
}
