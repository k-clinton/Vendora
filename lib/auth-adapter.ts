import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters';
import { db, generateId, dateToTimestamp, timestampToDate } from './sqlite';

// Custom SQLite adapter for NextAuth
export function SQLiteAdapter(): Adapter {
  return {
    // User methods
    async createUser(user: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
      const id = generateId();
      const now = dateToTimestamp(new Date());
      
      const stmt = db.prepare(`
        INSERT INTO users (id, name, email, email_verified, image, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        user.name,
        user.email,
        user.emailVerified ? dateToTimestamp(user.emailVerified) : null,
        user.image,
        'CUSTOMER',
        now,
        now
      );

      return {
        id,
        name: user.name,
        email: user.email!,
        emailVerified: user.emailVerified || null,
        image: user.image,
      };
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
      const user = stmt.get(id) as any;
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified ? timestampToDate(user.email_verified) : null,
        image: user.image,
      };
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email) as any;
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified ? timestampToDate(user.email_verified) : null,
        image: user.image,
      };
    },

    async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
      const stmt = db.prepare(`
        SELECT u.* FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE a.provider = ? AND a.provider_account_id = ?
      `);
      const user = stmt.get(provider, providerAccountId) as any;
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified ? timestampToDate(user.email_verified) : null,
        image: user.image,
      };
    },

    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>): Promise<AdapterUser> {
      const now = dateToTimestamp(new Date());
      const updates: string[] = ['updated_at = ?'];
      const values: any[] = [now];

      if (user.name !== undefined) {
        updates.push('name = ?');
        values.push(user.name);
      }
      if (user.email !== undefined) {
        updates.push('email = ?');
        values.push(user.email);
      }
      if (user.emailVerified !== undefined) {
        updates.push('email_verified = ?');
        values.push(user.emailVerified ? dateToTimestamp(user.emailVerified) : null);
      }
      if (user.image !== undefined) {
        updates.push('image = ?');
        values.push(user.image);
      }

      values.push(user.id);

      const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values);

      const getUserFunc = this.getUser;
      if (!getUserFunc) throw new Error('getUser method not available');
      const result = await getUserFunc(user.id);
      if (!result) throw new Error('User not found after update');
      return result;
    },

    async deleteUser(userId: string): Promise<void> {
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(userId);
    },

    // Account methods
    async linkAccount(account: AdapterAccount): Promise<AdapterAccount | null | undefined> {
      const id = generateId();
      
      const stmt = db.prepare(`
        INSERT INTO accounts (
          id, user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at, token_type,
          scope, id_token, session_state
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        account.userId,
        account.type,
        account.provider,
        account.providerAccountId,
        account.refresh_token,
        account.access_token,
        account.expires_at,
        account.token_type,
        account.scope,
        account.id_token,
        account.session_state
      );

      return account;
    },

    async unlinkAccount({ providerAccountId, provider }): Promise<void> {
      const stmt = db.prepare('DELETE FROM accounts WHERE provider = ? AND provider_account_id = ?');
      stmt.run(provider, providerAccountId);
    },

    // Session methods
    async createSession(session: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      const id = generateId();
      
      const stmt = db.prepare(`
        INSERT INTO sessions (id, session_token, user_id, expires)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        session.sessionToken,
        session.userId,
        dateToTimestamp(session.expires)
      );

      return session;
    },

    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const stmt = db.prepare(`
        SELECT s.*, u.* 
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ?
      `);
      const row = stmt.get(sessionToken) as any;
      
      if (!row) return null;

      const session: AdapterSession = {
        sessionToken: row.session_token,
        userId: row.user_id,
        expires: timestampToDate(row.expires),
      };

      const user: AdapterUser = {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: row.email_verified ? timestampToDate(row.email_verified) : null,
        image: row.image,
      };

      return { session, user };
    },

    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>): Promise<AdapterSession | null | undefined> {
      const updates: string[] = [];
      const values: any[] = [];

      if (session.expires !== undefined) {
        updates.push('expires = ?');
        values.push(dateToTimestamp(session.expires));
      }
      if (session.userId !== undefined) {
        updates.push('user_id = ?');
        values.push(session.userId);
      }

      if (updates.length === 0) return null;

      values.push(session.sessionToken);

      const stmt = db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE session_token = ?`);
      stmt.run(...values);

      const getStmt = db.prepare('SELECT * FROM sessions WHERE session_token = ?');
      const row = getStmt.get(session.sessionToken) as any;

      if (!row) return null;

      return {
        sessionToken: row.session_token,
        userId: row.user_id,
        expires: timestampToDate(row.expires),
      };
    },

    async deleteSession(sessionToken: string): Promise<void> {
      const stmt = db.prepare('DELETE FROM sessions WHERE session_token = ?');
      stmt.run(sessionToken);
    },

    // Verification token methods
    async createVerificationToken(token: VerificationToken): Promise<VerificationToken | null | undefined> {
      const stmt = db.prepare(`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (?, ?, ?)
      `);
      
      stmt.run(
        token.identifier,
        token.token,
        dateToTimestamp(token.expires)
      );

      return token;
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
      const getStmt = db.prepare('SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?');
      const row = getStmt.get(identifier, token) as any;
      
      if (!row) return null;

      const deleteStmt = db.prepare('DELETE FROM verification_tokens WHERE identifier = ? AND token = ?');
      deleteStmt.run(identifier, token);

      return {
        identifier: row.identifier,
        token: row.token,
        expires: timestampToDate(row.expires),
      };
    },
  };
}
