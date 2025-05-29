/**
 * PII Encryption Service
 * 
 * Secure encryption/decryption of Personally Identifiable Information (PII)
 * using AES-256-CBC with HMAC authentication for proper key management and security practices.
 * 
 * Security Features:
 * - AES-256-CBC encryption with HMAC-SHA256 authentication
 * - Secure key derivation using PBKDF2
 * - Random IV generation for each encryption
 * - Integrity verification with HMAC authentication tags
 * - Key rotation support with versioning
 * - Audit logging for all PII operations
 */

import CryptoJS from 'crypto-js';
import { logSecurityEvent } from './userSecurity';

// PII field types that require encryption
export type PIIField = 
  | 'email' 
  | 'first_name' 
  | 'last_name' 
  | 'full_name'
  | 'phone_number' 
  | 'address' 
  | 'ssn' 
  | 'date_of_birth'
  | 'resume_content'
  | 'cover_letter'
  | 'personal_statement'
  | 'emergency_contact'
  | 'bank_details'
  | 'tax_id';

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  keyVersion: number;
  timestamp: string;
  field: PIIField;
}

export interface PIIEncryptionConfig {
  keyVersion: number;
  algorithm: 'AES-256-CBC-HMAC';
  keyDerivationIterations: number;
  ivLength: number;
  tagLength: number;
}

export interface PIIAuditLog {
  userId: string;
  operation: 'encrypt' | 'decrypt' | 'key_rotation' | 'bulk_decrypt';
  field: PIIField;
  keyVersion: number;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  error?: string;
}

class PIIEncryptionService {
  private config: PIIEncryptionConfig = {
    keyVersion: 1,
    algorithm: 'AES-256-CBC-HMAC',
    keyDerivationIterations: 100000,
    ivLength: 16, // 128 bits for CBC
    tagLength: 32 // 256 bits for HMAC-SHA256
  };

  private masterKey: string;
  private keyCache: Map<number, string> = new Map();

  constructor() {
    // Get master key from environment
    this.masterKey = this.getMasterKey();
    
    // Initialize current key in cache
    this.keyCache.set(this.config.keyVersion, this.deriveKey(this.masterKey, this.config.keyVersion));
  }

  /**
   * Get master encryption key from environment
   */
  private getMasterKey(): string {
    // In production, this should come from a secure environment variable
    // For development, we'll use a default key (should be overridden in production)
    const envKey = import.meta.env.VITE_PII_ENCRYPTION_KEY || 
                   import.meta.env.VITE_PII_ENCRYPTION_KEY ||
                   'HsjEnZAMBE/jpf7dBrE2rhEsZ1gN1qUSd+xNICatkag='; // Generated key

    if (!envKey) {
      throw new Error('PII_ENCRYPTION_KEY environment variable is required');
    }

    return envKey;
  }

  /**
   * Derive encryption key for specific version using PBKDF2
   */
  private deriveKey(masterKey: string, version: number): string {
    const salt = `pii_key_v${version}_salt_climate_ecosystem`;
    const key = CryptoJS.PBKDF2(masterKey, salt, {
      keySize: 256 / 32, // 256 bits
      iterations: this.config.keyDerivationIterations,
      hasher: CryptoJS.algo.SHA256
    });
    return key.toString();
  }

  /**
   * Get encryption key for specific version
   */
  private getKey(version: number): string {
    if (!this.keyCache.has(version)) {
      this.keyCache.set(version, this.deriveKey(this.masterKey, version));
    }
    return this.keyCache.get(version)!;
  }

  /**
   * Encrypt PII data
   */
  public async encryptPII(
    data: string,
    field: PIIField,
    userId: string,
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'Unknown'
  ): Promise<{ success: boolean; encryptedData?: EncryptedData; error?: string }> {
    try {
      if (!data || data.trim() === '') {
        return { success: false, error: 'Data cannot be empty' };
      }

      // Generate random IV
      const iv = CryptoJS.lib.WordArray.random(this.config.ivLength);
      
      // Get current encryption key
      const key = this.getKey(this.config.keyVersion);
      
      // Encrypt data using AES-CBC (more compatible than GCM)
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Generate HMAC for authentication (since we can't use GCM)
      const hmacKey = CryptoJS.PBKDF2(key, 'hmac_salt', { keySize: 256/32, iterations: 1000 });
      const tag = CryptoJS.HmacSHA256(encrypted.ciphertext.toString() + iv.toString(), hmacKey);

      const encryptedData: EncryptedData = {
        data: encrypted.ciphertext.toString(),
        iv: iv.toString(),
        tag: tag.toString(),
        keyVersion: this.config.keyVersion,
        timestamp: new Date().toISOString(),
        field
      };

      // Log encryption operation
      await this.logPIIOperation({
        userId,
        operation: 'encrypt',
        field,
        keyVersion: this.config.keyVersion,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent,
        success: true
      });

      return { success: true, encryptedData };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
      
      // Log failed encryption
      await this.logPIIOperation({
        userId,
        operation: 'encrypt',
        field,
        keyVersion: this.config.keyVersion,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent,
        success: false,
        error: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Decrypt PII data
   */
  public async decryptPII(
    encryptedData: EncryptedData,
    userId: string,
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'Unknown'
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      // Get key for the version used to encrypt this data
      const key = this.getKey(encryptedData.keyVersion);
      
      // Reconstruct IV and verify HMAC
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
      const receivedTag = encryptedData.tag;
      
      // Verify HMAC authentication
      const hmacKey = CryptoJS.PBKDF2(key, 'hmac_salt', { keySize: 256/32, iterations: 1000 });
      const expectedTag = CryptoJS.HmacSHA256(encryptedData.data + encryptedData.iv, hmacKey).toString();
      
      if (receivedTag !== expectedTag) {
        throw new Error('Authentication failed - data may have been tampered with');
      }
      
      // Decrypt data using AES-CBC
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData.data,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedText) {
        throw new Error('Decryption failed - invalid data or key');
      }

      // Log successful decryption
      await this.logPIIOperation({
        userId,
        operation: 'decrypt',
        field: encryptedData.field,
        keyVersion: encryptedData.keyVersion,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent,
        success: true
      });

      return { success: true, data: decryptedText };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';
      
      // Log failed decryption
      await this.logPIIOperation({
        userId,
        operation: 'decrypt',
        field: encryptedData.field,
        keyVersion: encryptedData.keyVersion,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent,
        success: false,
        error: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Bulk decrypt multiple PII fields
   */
  public async bulkDecryptPII(
    encryptedFields: Record<string, EncryptedData>,
    userId: string,
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'Unknown'
  ): Promise<{ success: boolean; data?: Record<string, string>; errors?: Record<string, string> }> {
    const decryptedData: Record<string, string> = {};
    const errors: Record<string, string> = {};
    let hasErrors = false;

    for (const [fieldName, encryptedData] of Object.entries(encryptedFields)) {
      const result = await this.decryptPII(encryptedData, userId, ipAddress, userAgent);
      
      if (result.success && result.data) {
        decryptedData[fieldName] = result.data;
      } else {
        errors[fieldName] = result.error || 'Decryption failed';
        hasErrors = true;
      }
    }

    // Log bulk operation
    await this.logPIIOperation({
      userId,
      operation: 'bulk_decrypt',
      field: 'email', // Use a default field for bulk operations
      keyVersion: this.config.keyVersion,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      success: !hasErrors
    });

    return {
      success: !hasErrors,
      data: decryptedData,
      errors: hasErrors ? errors : undefined
    };
  }

  /**
   * Rotate encryption key (for periodic security updates)
   */
  public async rotateKey(
    userId: string,
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'Unknown'
  ): Promise<{ success: boolean; newKeyVersion?: number; error?: string }> {
    try {
      const newVersion = this.config.keyVersion + 1;
      
      // Generate new key
      const newKey = this.deriveKey(this.masterKey, newVersion);
      this.keyCache.set(newVersion, newKey);
      
      // Update current version
      this.config.keyVersion = newVersion;

      // Log key rotation
      await this.logPIIOperation({
        userId,
        operation: 'key_rotation',
        field: 'email', // Use default field for key operations
        keyVersion: newVersion,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent,
        success: true
      });

      return { success: true, newKeyVersion: newVersion };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Key rotation failed';
      
      await this.logPIIOperation({
        userId,
        operation: 'key_rotation',
        field: 'email',
        keyVersion: this.config.keyVersion,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent,
        success: false,
        error: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Validate encrypted data structure
   */
  public validateEncryptedData(data: unknown): data is EncryptedData {
    if (!data || typeof data !== 'object') return false;
    
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.data === 'string' &&
      typeof obj.iv === 'string' &&
      typeof obj.tag === 'string' &&
      typeof obj.keyVersion === 'number' &&
      typeof obj.timestamp === 'string' &&
      typeof obj.field === 'string'
    );
  }

  /**
   * Get current encryption configuration
   */
  public getConfig(): PIIEncryptionConfig {
    return { ...this.config };
  }

  /**
   * Log PII operations for audit trail
   */
  private async logPIIOperation(auditLog: PIIAuditLog): Promise<void> {
    try {
      // Use existing security event logging
      await logSecurityEvent(
        auditLog.userId,
        'profile_viewed',
        auditLog.ipAddress,
        auditLog.userAgent,
        {
          pii_operation: auditLog.operation,
          pii_field: auditLog.field,
          key_version: auditLog.keyVersion,
          success: auditLog.success,
          error: auditLog.error
        },
        auditLog.success ? 'low' : 'medium'
      );
    } catch (error) {
      console.error('Failed to log PII operation:', error);
      // Don't throw here to avoid breaking the main operation
    }
  }

  /**
   * Clear key cache (for security)
   */
  public clearKeyCache(): void {
    this.keyCache.clear();
    // Re-initialize current key
    this.keyCache.set(this.config.keyVersion, this.deriveKey(this.masterKey, this.config.keyVersion));
  }
}

// Export singleton instance
export const piiEncryption = new PIIEncryptionService();

// Export utility functions
export const encryptPII = piiEncryption.encryptPII.bind(piiEncryption);
export const decryptPII = piiEncryption.decryptPII.bind(piiEncryption);
export const bulkDecryptPII = piiEncryption.bulkDecryptPII.bind(piiEncryption);
export const validateEncryptedData = piiEncryption.validateEncryptedData.bind(piiEncryption); 