/**
 * Secret Manager Service
 * 
 * Handles secure storage and retrieval of API keys and credentials.
 * Supports multiple backends: AWS Secrets Manager, HashiCorp Vault, or environment variables.
 * 
 * Usage:
 *   const openaiKey = await secretsManager.getSecret('openai_api_key');
 *   const config = await secretsManager.getSecrets(['openai_api_key', 'gemmini_api_key']);
 */

import * as aws from '@aws-sdk/client-secrets-manager';
import axios from 'axios';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SecretsManagerConfig {
  type: 'aws' | 'vault' | 'env';
  region?: string;
  vaultAddr?: string;
  vaultToken?: string;
  cacheSeconds?: number;
}

interface CachedSecret {
  value: string;
  expiresAt: number;
}

interface GetSecretOptions {
  cache?: boolean;
  timeout?: number;
}

// ============================================================================
// SECRETS MANAGER SERVICE
// ============================================================================

class SecretsManager {
  private config: SecretsManagerConfig;
  private cache: Map<string, CachedSecret> = new Map();
  private awsClient: aws.SecretsManagerClient | null = null;
  private cacheSeconds: number;

  constructor(config: SecretsManagerConfig = { type: 'env', cacheSeconds: 3600 }) {
    this.config = config;
    this.cacheSeconds = config.cacheSeconds || 3600;

    if (config.type === 'aws') {
      this.awsClient = new aws.SecretsManagerClient({ region: config.region || 'us-east-1' });
    }

    // Clear cache every hour
    setInterval(() => this.cache.clear(), this.cacheSeconds * 1000);
  }

  /**
   * Get a single secret value
   */
  async getSecret(
    secretName: string,
    options: GetSecretOptions = {}
  ): Promise<string> {
    const { cache = true, timeout = 5000 } = options;

    // Check cache first
    if (cache) {
      const cached = this.cache.get(secretName);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }
    }

    try {
      let value: string;

      if (this.config.type === 'aws') {
        value = await this.getSecretFromAWS(secretName, timeout);
      } else if (this.config.type === 'vault') {
        value = await this.getSecretFromVault(secretName, timeout);
      } else {
        value = this.getSecretFromEnv(secretName);
      }

      // Cache the secret
      if (cache) {
        this.cache.set(secretName, {
          value,
          expiresAt: Date.now() + this.cacheSeconds * 1000,
        });
      }

      return value;
    } catch (error) {
      console.error(`[SecretsManager] Failed to get secret: ${secretName}`, error);
      throw new Error(`Secret not found: ${secretName}`);
    }
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets(
    secretNames: string[],
    options: GetSecretOptions = {}
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    const promises = secretNames.map(async (name) => {
      try {
        results[name] = await this.getSecret(name, options);
      } catch (error) {
        console.warn(`[SecretsManager] Could not retrieve secret: ${name}`);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get secret from AWS Secrets Manager
   */
  private async getSecretFromAWS(
    secretName: string,
    timeout: number
  ): Promise<string> {
    if (!this.awsClient) {
      throw new Error('AWS client not initialized');
    }

    try {
      const command = new aws.GetSecretValueCommand({ SecretId: secretName });
      const response = await Promise.race([
        this.awsClient.send(command),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AWS timeout')), timeout)
        ),
      ]);

      if (response.SecretString) {
        // If it's JSON, parse and return specific field or full object
        try {
          const parsed = JSON.parse(response.SecretString);
          return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        } catch {
          return response.SecretString;
        }
      }

      if (response.SecretBinary) {
        return Buffer.from(response.SecretBinary as string, 'base64').toString('utf-8');
      }

      throw new Error('No secret value found');
    } catch (error) {
      throw new Error(`AWS Secrets Manager error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get secret from HashiCorp Vault
   */
  private async getSecretFromVault(
    secretName: string,
    timeout: number
  ): Promise<string> {
    if (!this.config.vaultAddr || !this.config.vaultToken) {
      throw new Error('Vault address or token not configured');
    }

    try {
      const response = await Promise.race([
        axios.get(`${this.config.vaultAddr}/v1/secret/data/${secretName}`, {
          headers: { 'X-Vault-Token': this.config.vaultToken },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Vault timeout')), timeout)
        ),
      ]);

      const value = response.data?.data?.data?.value;
      if (!value) {
        throw new Error('Secret value not found in Vault');
      }

      return value;
    } catch (error) {
      throw new Error(`Vault error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get secret from environment variables
   * Converts secret name to UPPERCASE_SNAKE_CASE
   */
  private getSecretFromEnv(secretName: string): string {
    const envKey = secretName.toUpperCase().replace(/-/g, '_');
    const value = process.env[envKey];

    if (!value) {
      throw new Error(`Environment variable not found: ${envKey}`);
    }

    return value;
  }

  /**
   * Set a secret (AWS/Vault only - not for env)
   */
  async setSecret(secretName: string, secretValue: string): Promise<void> {
    if (this.config.type === 'env') {
      console.warn('[SecretsManager] Cannot set secrets with env backend');
      return;
    }

    if (this.config.type === 'aws') {
      await this.setSecretInAWS(secretName, secretValue);
    } else if (this.config.type === 'vault') {
      await this.setSecretInVault(secretName, secretValue);
    }

    // Invalidate cache
    this.cache.delete(secretName);
  }

  /**
   * Set secret in AWS Secrets Manager
   */
  private async setSecretInAWS(secretName: string, secretValue: string): Promise<void> {
    if (!this.awsClient) {
      throw new Error('AWS client not initialized');
    }

    try {
      const command = new aws.PutSecretValueCommand({
        SecretId: secretName,
        SecretString: secretValue,
      });
      await this.awsClient.send(command);
      console.log(`[SecretsManager] Secret updated in AWS: ${secretName}`);
    } catch (error) {
      throw new Error(`Failed to set secret in AWS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set secret in HashiCorp Vault
   */
  private async setSecretInVault(secretName: string, secretValue: string): Promise<void> {
    if (!this.config.vaultAddr || !this.config.vaultToken) {
      throw new Error('Vault address or token not configured');
    }

    try {
      await axios.post(
        `${this.config.vaultAddr}/v1/secret/data/${secretName}`,
        { data: { value: secretValue } },
        { headers: { 'X-Vault-Token': this.config.vaultToken } }
      );
      console.log(`[SecretsManager] Secret updated in Vault: ${secretName}`);
    } catch (error) {
      throw new Error(`Failed to set secret in Vault: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Rotate a secret (invalidate cache and refetch)
   */
  async rotateSecret(secretName: string): Promise<string> {
    this.cache.delete(secretName);
    return this.getSecret(secretName, { cache: true });
  }

  /**
   * Health check - verify secrets manager is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.config.type === 'aws' && this.awsClient) {
        const command = new aws.ListSecretsCommand({ MaxResults: 1 });
        await this.awsClient.send(command);
        return true;
      } else if (this.config.type === 'vault') {
        await axios.get(`${this.config.vaultAddr}/v1/sys/health`, {
          headers: { 'X-Vault-Token': this.config.vaultToken },
        });
        return true;
      } else {
        // For env, just check that critical vars exist
        return !!(process.env.OPENAI_API_KEY && process.env.GEMMINI_API_KEY);
      }
    } catch (error) {
      console.error('[SecretsManager] Health check failed:', error);
      return false;
    }
  }

  /**
   * Clear all cached secrets
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[SecretsManager] Cache cleared');
  }
}

// ============================================================================
// SINGLETON INSTANCE & INITIALIZATION
// ============================================================================

let secretsManagerInstance: SecretsManager;

/**
 * Initialize the secrets manager
 */
export function initializeSecretsManager(config?: SecretsManagerConfig): SecretsManager {
  const selectedConfig: SecretsManagerConfig = config || {
    type: (process.env.SECRETS_MANAGER as any) || 'env',
    region: process.env.AWS_REGION,
    vaultAddr: process.env.VAULT_ADDR,
    vaultToken: process.env.VAULT_TOKEN,
    cacheSeconds: 3600,
  };

  secretsManagerInstance = new SecretsManager(selectedConfig);
  return secretsManagerInstance;
}

/**
 * Get the secrets manager instance (must call initializeSecretsManager first)
 */
export function getSecretsManager(): SecretsManager {
  if (!secretsManagerInstance) {
    secretsManagerInstance = initializeSecretsManager();
  }
  return secretsManagerInstance;
}

// ============================================================================
// HELPER FUNCTION FOR BACKEND INITIALIZATION
// ============================================================================

/**
 * Initialize and validate all required secrets
 * Call this during server startup
 */
export async function validateSecrets(): Promise<{
  valid: boolean;
  missing: string[];
  errors: string[];
}> {
  const requiredSecrets = [
    'OPENAI_API_KEY',
    'GEMMINI_API_KEY',
    'LLM_MODEL',
  ];

  const secretsManager = getSecretsManager();
  const results = {
    valid: true,
    missing: [] as string[],
    errors: [] as string[],
  };

  for (const secretName of requiredSecrets) {
    try {
      const value = await secretsManager.getSecret(secretName);
      if (!value) {
        results.missing.push(secretName);
        results.valid = false;
      }
    } catch (error) {
      results.errors.push(`${secretName}: ${error instanceof Error ? error.message : String(error)}`);
      results.valid = false;
    }
  }

  return results;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default SecretsManager;
