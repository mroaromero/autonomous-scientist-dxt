import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

interface EncryptedStorage {
  data: string;
  iv: string;
  salt: string;
  timestamp: string;
}

export class SecurityManager {
  private configDir: string;
  private keysFile: string;
  private masterKey: Buffer | null = null;

  constructor() {
    // Store encrypted keys in user's home directory
    this.configDir = path.join(os.homedir(), '.autonomous-scientist');
    this.keysFile = path.join(this.configDir, 'encrypted-keys.json');
    this.initializeConfigDir();
  }

  private initializeConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { mode: 0o700 }); // Owner read/write/execute only
    }
  }

  private async getMasterKey(): Promise<Buffer> {
    if (this.masterKey) {
      return this.masterKey;
    }

    // Generate or retrieve master key
    const keyFile = path.join(this.configDir, '.master-key');
    
    if (fs.existsSync(keyFile)) {
      // Read existing key
      const keyData = await fs.readFile(keyFile, 'utf8');
      this.masterKey = Buffer.from(keyData, 'hex');
    } else {
      // Generate new master key
      this.masterKey = crypto.randomBytes(32);
      await fs.writeFile(keyFile, this.masterKey.toString('hex'), { mode: 0o600 });
    }

    return this.masterKey;
  }

  async storeAPIKey(service: string, apiKey: string): Promise<void> {
    try {
      const masterKey = await this.getMasterKey();
      
      // Generate random salt and IV for this encryption
      const salt = crypto.randomBytes(16);
      const iv = crypto.randomBytes(16);
      
      // Derive encryption key from master key and salt
      const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
      
      // Encrypt the API key
      const cipher = crypto.createCipher('aes-256-gcm', key);
      cipher.setAAD(Buffer.from(service, 'utf8'));
      
      let encrypted = cipher.update(apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      
      // Prepare storage object
      const storageData: EncryptedStorage = {
        data: encrypted + ':' + authTag.toString('hex'),
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        timestamp: new Date().toISOString()
      };
      
      // Read existing keys or create new storage
      let keysStorage: Record<string, EncryptedStorage> = {};
      if (fs.existsSync(this.keysFile)) {
        const existing = await fs.readFile(this.keysFile, 'utf8');
        keysStorage = JSON.parse(existing);
      }
      
      // Store the encrypted key
      keysStorage[service] = storageData;
      
      // Write back to file with secure permissions
      await fs.writeFile(
        this.keysFile, 
        JSON.stringify(keysStorage, null, 2),
        { mode: 0o600 }
      );
      
      console.error(`✅ API key for ${service} stored securely`);
    } catch (error) {
      console.error(`❌ Failed to store API key for ${service}:`, error);
      throw new Error(`Failed to securely store API key for ${service}`);
    }
  }

  async retrieveAPIKey(service: string): Promise<string | null> {
    try {
      if (!fs.existsSync(this.keysFile)) {
        return null;
      }

      const keysStorage = JSON.parse(await fs.readFile(this.keysFile, 'utf8'));
      const serviceData = keysStorage[service];
      
      if (!serviceData) {
        return null;
      }

      const masterKey = await this.getMasterKey();
      
      // Reconstruct encryption components
      const salt = Buffer.from(serviceData.salt, 'hex');
      const iv = Buffer.from(serviceData.iv, 'hex');
      const [encryptedData, authTagHex] = serviceData.data.split(':');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      // Derive the same encryption key
      const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
      
      // Decrypt the API key
      const decipher = crypto.createDecipher('aes-256-gcm', key);
      decipher.setAAD(Buffer.from(service, 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error(`❌ Failed to retrieve API key for ${service}:`, error);
      return null;
    }
  }

  async listStoredServices(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.keysFile)) {
        return [];
      }

      const keysStorage = JSON.parse(await fs.readFile(this.keysFile, 'utf8'));
      return Object.keys(keysStorage);
    } catch (error) {
      console.error('❌ Failed to list stored services:', error);
      return [];
    }
  }

  async removeAPIKey(service: string): Promise<boolean> {
    try {
      if (!fs.existsSync(this.keysFile)) {
        return false;
      }

      const keysStorage = JSON.parse(await fs.readFile(this.keysFile, 'utf8'));
      
      if (!(service in keysStorage)) {
        return false;
      }

      delete keysStorage[service];
      
      await fs.writeFile(
        this.keysFile,
        JSON.stringify(keysStorage, null, 2),
        { mode: 0o600 }
      );
      
      console.error(`✅ API key for ${service} removed securely`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove API key for ${service}:`, error);
      return false;
    }
  }

  async clearAllKeys(): Promise<void> {
    try {
      if (fs.existsSync(this.keysFile)) {
        await fs.unlink(this.keysFile);
      }
      
      const masterKeyFile = path.join(this.configDir, '.master-key');
      if (fs.existsSync(masterKeyFile)) {
        await fs.unlink(masterKeyFile);
      }
      
      this.masterKey = null;
      console.error('✅ All API keys cleared securely');
    } catch (error) {
      console.error('❌ Failed to clear API keys:', error);
      throw new Error('Failed to clear API keys securely');
    }
  }

  // Utility method to validate API key format
  validateAPIKeyFormat(service: string, key: string): { valid: boolean; error?: string } {
    const patterns = {
      openai: /^sk-[A-Za-z0-9]{48,}$/,
      anthropic: /^sk-ant-[A-Za-z0-9\-_]{95,}$/,
      semantic_scholar: /^[A-Za-z0-9]{40}$/, // If they ever require keys
      crossref: /^[A-Za-z0-9\-_]{20,}$/ // Polite pool token
    };

    const pattern = patterns[service as keyof typeof patterns];
    
    if (!pattern) {
      return { valid: true }; // Unknown service, assume valid
    }

    if (!pattern.test(key)) {
      return {
        valid: false,
        error: `Invalid ${service} API key format. Please check your key and try again.`
      };
    }

    return { valid: true };
  }

  // Check if sensitive data should be logged (never log API keys)
  sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      // Mask potential API keys
      return data.replace(/sk-[A-Za-z0-9\-_]{20,}/g, 'sk-***MASKED***');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (['key', 'token', 'password', 'secret'].some(secret => 
          key.toLowerCase().includes(secret))) {
          sanitized[key] = '***MASKED***';
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }
}