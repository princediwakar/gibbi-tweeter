import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import type { Account } from './types';

interface AccountRow {
  id: string;
  name: string;
  twitter_handle: string;
  status: Account['status'] | 'deleted';
  twitter_api_key_encrypted: string;
  twitter_api_secret_encrypted: string;
  twitter_access_token_encrypted: string;
  twitter_access_token_secret_encrypted: string;
  personas: string[];
  branding: Account['branding'];
  created_at: Date;
  updated_at: Date;
}


class AccountService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private accountCache: Map<string, Account> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const key = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('NEXTAUTH_SECRET or ENCRYPTION_KEY environment variable is required for account encryption');
    }
    
    // Create a 32-byte key for AES-256
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private isValidCache(accountId: string): boolean {
    const expiry = this.cacheExpiry.get(accountId);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheEntry(accountId: string, account: Account): void {
    this.accountCache.set(accountId, account);
    this.cacheExpiry.set(accountId, Date.now() + this.cacheTimeout);
  }

  private mapRowToAccount(row: AccountRow): Account {
    return {
      id: row.id,
      name: row.name,
      twitter_handle: row.twitter_handle,
      status: row.status as Account['status'],
      twitter_api_key: this.decrypt(row.twitter_api_key_encrypted),
      twitter_api_secret: this.decrypt(row.twitter_api_secret_encrypted),
      twitter_access_token: this.decrypt(row.twitter_access_token_encrypted),
      twitter_access_token_secret: this.decrypt(row.twitter_access_token_secret_encrypted),
      personas: row.personas,
      branding: row.branding,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async getAccount(accountId: string): Promise<Account | null> {
    // Check cache first
    if (this.isValidCache(accountId)) {
      return this.accountCache.get(accountId) || null;
    }

    try {
      const result = await sql`
        SELECT * FROM accounts WHERE id = ${accountId} AND status != 'deleted'
      `;

      if (result.rows.length === 0) {
        return null;
      }

      const account = this.mapRowToAccount(result.rows[0] as AccountRow);
      this.setCacheEntry(accountId, account);
      return account;
    } catch (error) {
      console.error('Error fetching account:', error);
      throw new Error(`Failed to fetch account: ${accountId}`);
    }
  }

  async getAllAccounts(): Promise<Account[]> {
    try {
      const result = await sql`
        SELECT * FROM accounts WHERE status = 'active' ORDER BY created_at
      `;

      return result.rows.map((row) => this.mapRowToAccount(row as AccountRow));
    } catch (error) {
      console.error('Error fetching all accounts:', error);
      throw new Error('Failed to fetch accounts');
    }
  }

  async createAccount(accountData: Omit<Account, 'created_at' | 'updated_at'>): Promise<Account> {
    try {
      const result = await sql`
        INSERT INTO accounts (
          id, name, twitter_handle, status,
          twitter_api_key_encrypted, twitter_api_secret_encrypted, 
          twitter_access_token_encrypted, twitter_access_token_secret_encrypted,
          personas, branding
        ) VALUES (
          ${accountData.id},
          ${accountData.name},
          ${accountData.twitter_handle},
          ${accountData.status},
          ${this.encrypt(accountData.twitter_api_key)},
          ${this.encrypt(accountData.twitter_api_secret)},
          ${this.encrypt(accountData.twitter_access_token)},
          ${this.encrypt(accountData.twitter_access_token_secret)},
          ${JSON.stringify(accountData.personas)},
          ${JSON.stringify(accountData.branding)}
        )
        RETURNING *
      `;

      const account = this.mapRowToAccount(result.rows[0] as AccountRow);
      this.setCacheEntry(account.id, account);
      return account;
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error(`Failed to create account: ${accountData.id}`);
    }
  }

  async updateAccount(accountId: string, updates: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>): Promise<Account> {
    const setClause: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case 'twitter_api_key':
            setClause.push(`twitter_api_key_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'twitter_api_secret':
            setClause.push(`twitter_api_secret_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'twitter_access_token':
            setClause.push(`twitter_access_token_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'twitter_access_token_secret':
            setClause.push(`twitter_access_token_secret_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'personas':
            setClause.push(`personas = $${paramIndex++}`);
            values.push(JSON.stringify(value));
            break;
          case 'branding':
            setClause.push(`branding = $${paramIndex++}`);
            values.push(JSON.stringify(value));
            break;
          case 'name':
          case 'status':
          case 'twitter_handle':
            setClause.push(`${key} = $${paramIndex++}`);
            values.push(value);
            break;
          default:
            console.warn(`updateAccount encountered an unhandled property: ${key}`);
        }
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(accountId);
    
    try {
      const queryText = `
        UPDATE accounts 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      const result = await sql.query(queryText, values);

      if (result.rows.length === 0) {
        throw new Error(`Account not found: ${accountId}`);
      }

      const account = this.mapRowToAccount(result.rows[0] as AccountRow);
      this.setCacheEntry(accountId, account);
      return account;
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error(`Failed to update account: ${accountId}`);
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      const result = await sql`
        UPDATE accounts SET status = 'deleted', updated_at = NOW() WHERE id = ${accountId}
      `;

      if (result.rowCount === 0) {
        throw new Error(`Account not found: ${accountId}`);
      }

      // Remove from cache
      this.accountCache.delete(accountId);
      this.cacheExpiry.delete(accountId);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error(`Failed to delete account: ${accountId}`);
    }
  }

  async getAccountForPersona(persona: string): Promise<Account | null> {
    try {
      const result = await sql`
        SELECT * FROM accounts 
        WHERE status = 'active' 
        AND personas @> ${JSON.stringify([persona])}
      `;

      if (result.rows.length === 0) {
        return null;
      }

      const account = this.mapRowToAccount(result.rows[0] as AccountRow);
      this.setCacheEntry(account.id, account);
      return account;
    } catch (error) {
      console.error('Error finding account for persona:', error);
      throw new Error(`Failed to find account for persona: ${persona}`);
    }
  }

  async validateTwitterCredentials(credentials: {
    twitter_api_key: string;
    twitter_api_secret: string;
    twitter_access_token: string;
    twitter_access_token_secret: string;
  }): Promise<{ isValid: boolean; error?: string }> {
    // Basic validation - ensure all credentials are present
    if (!credentials.twitter_api_key || !credentials.twitter_api_secret || 
        !credentials.twitter_access_token || !credentials.twitter_access_token_secret) {
      return { isValid: false, error: 'All Twitter credentials are required' };
    }
    
    // Check basic format
    if (credentials.twitter_api_key.length < 20 || credentials.twitter_api_secret.length < 40 ||
        credentials.twitter_access_token.length < 40 || credentials.twitter_access_token_secret.length < 40) {
      return { isValid: false, error: 'Invalid credential format' };
    }
    
    // TODO: Add actual Twitter API validation when needed
    return { isValid: true };
  }

  async getAccountHealth(accountId: string): Promise<{
    isHealthy: boolean;
    account?: Account;
    twitterConnectionValid?: boolean;
    error?: string;
  }> {
    try {
      const account = await this.getAccount(accountId);
      if (!account) {
        return { isHealthy: false, error: 'Account not found' };
      }

      if (account.status !== 'active') {
        return { 
          isHealthy: false, 
          account, 
          twitterConnectionValid: false,
          error: 'Account is inactive' 
        };
      }

      // Test Twitter connection
      const validation = await this.validateTwitterCredentials({
        twitter_api_key: account.twitter_api_key,
        twitter_api_secret: account.twitter_api_secret,
        twitter_access_token: account.twitter_access_token,
        twitter_access_token_secret: account.twitter_access_token_secret
      });

      return {
        isHealthy: validation.isValid,
        account,
        twitterConnectionValid: validation.isValid,
        error: validation.error
      };
    } catch (error) {
      console.error('Error checking account health:', error);
      return { 
        isHealthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error checking account health'
      };
    }
  }

  clearCache(): void {
    this.accountCache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const accountService = new AccountService();
export default accountService;
