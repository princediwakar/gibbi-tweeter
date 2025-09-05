import { accountService, type Account } from './accountService';

export interface AccountConfig {
  id: string;
  name: string;
  twitter_handle: string;
  twitter_api_key: string;
  twitter_api_secret: string;
  twitter_access_token: string;
  twitter_access_token_secret: string;
  personas: string[];
  branding: {
    theme: string;
    audience: string;
    tone: string;
    cta_frequency?: number;
    cta_message?: string;
  };
}

// Convert Account to AccountConfig format
function accountToAccountConfig(account: Account): AccountConfig {
  return {
    id: account.id,
    name: account.name,
    twitter_handle: account.twitter_handle,
    twitter_api_key: account.twitter_api_key,
    twitter_api_secret: account.twitter_api_secret,
    twitter_access_token: account.twitter_access_token,
    twitter_access_token_secret: account.twitter_access_token_secret,
    personas: account.personas,
    branding: account.branding
  };
}

export async function getAccountConfig(accountId: string): Promise<AccountConfig> {
  const callId = Math.random().toString(36).substring(2, 8);
  console.log(`[getAccountConfig:${callId}] Attempting to fetch account: ${accountId}`);
  
  const account = await accountService.getAccount(accountId);
  console.log(`[getAccountConfig:${callId}] Database query result for ${accountId}:`, account ? 'Found' : 'Not found');
  
  if (!account) {
    throw new Error(`Account configuration not found in database for: ${accountId}`);
  }
  
  const config = accountToAccountConfig(account);
  console.log(`[getAccountConfig:${callId}] Successfully converted to config. Personas: ${config.personas?.join(', ')}`);
  return config;
}

export async function getAccountForPersona(persona: string): Promise<AccountConfig> {
  const account = await accountService.getAccountForPersona(persona);
  
  if (!account) {
    throw new Error(`No account found in database for persona: ${persona}`);
  }
  
  return accountToAccountConfig(account);
}

export async function getAllAccounts(): Promise<AccountConfig[]> {
  const accounts = await accountService.getAllAccounts();
  return accounts.map(accountToAccountConfig);
}

export async function getAccountIds(): Promise<string[]> {
  const accounts = await accountService.getAllAccounts();
  return accounts.map(account => account.id);
}

// Export the service for direct access
export { accountService } from './accountService';