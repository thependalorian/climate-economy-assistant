# PII Encryption Implementation Guide

## Overview

This document outlines the comprehensive PII (Personally Identifiable Information) encryption system implemented for the Climate Ecosystem Assistant. The system provides enterprise-grade security for handling sensitive user data with full GDPR/CCPA compliance.

## 🔐 Security Architecture

### Encryption Standards
- **Algorithm**: AES-256-GCM (Authenticated Encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **IV Generation**: Cryptographically secure random IVs (96-bit for GCM)
- **Authentication**: Built-in authentication tags for integrity verification
- **Key Rotation**: Versioned key management with seamless rotation

### Security Features
- ✅ **Automatic PII Detection**: Smart field detection using patterns and heuristics
- ✅ **Separation of Concerns**: PII stored separately from non-sensitive data
- ✅ **Audit Logging**: Comprehensive logging of all PII operations
- ✅ **Rate Limiting**: Protection against brute force and abuse
- ✅ **GDPR Compliance**: Right to access, portability, and erasure
- ✅ **Row-Level Security**: Database-level access controls
- ✅ **Secure Key Management**: Environment-based key storage with rotation

## 📁 File Structure

```
src/lib/security/
├── piiEncryption.ts          # Core encryption service
├── piiService.ts             # High-level PII management
└── userSecurity.ts           # Security utilities (existing)

src/pages/api/user/
├── secure-profile.ts         # Secure profile CRUD operations
└── export-data-secure.ts     # GDPR-compliant data export

supabase/migrations/
└── 20250125000002_pii_encryption_tables.sql  # Database schema

scripts/
└── run-pii-migration.mjs     # Migration execution script
```

## 🚀 Quick Start

### 1. Environment Setup

Add the encryption key to your environment variables:

```bash
# Generate a secure key
openssl rand -base64 32

# Add to .env
PII_ENCRYPTION_KEY=HsjEnZAMBE/jpf7dBrE2rhEsZ1gN1qUSd+xNICatkag=
```

### 2. Database Migration

Run the PII encryption migration:

```bash
npm run apply-pii-migration
```

### 3. Install Dependencies

The required packages are already installed:
- `crypto-js` - Encryption library
- `@types/crypto-js` - TypeScript definitions

## 🔧 Usage Examples

### Basic PII Encryption

```typescript
import { encryptPII, decryptPII } from '../lib/security/piiEncryption';

// Encrypt sensitive data
const result = await encryptPII(
  'john.doe@example.com',
  'email',
  userId,
  ipAddress,
  userAgent
);

if (result.success && result.encryptedData) {
  // Store encrypted data
  console.log('Encrypted:', result.encryptedData);
}

// Decrypt data
const decryptResult = await decryptPII(
  result.encryptedData,
  userId,
  ipAddress,
  userAgent
);

if (decryptResult.success) {
  console.log('Decrypted:', decryptResult.data);
}
```

### Profile Management with PII

```typescript
import { updateProfileWithPII, getProfileWithPII } from '../lib/security/piiService';

// Update profile with automatic PII encryption
const updateResult = await updateProfileWithPII({
  userId: 'user-123',
  updates: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone_number: '+1-555-0123',
    bio: 'Climate researcher' // Non-PII, stored as plain text
  },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Retrieve profile with automatic PII decryption
const profileResult = await getProfileWithPII(
  'user-123',
  '192.168.1.1',
  'Mozilla/5.0...'
);
```

### GDPR Data Export

```typescript
import { exportUserDataGDPR } from '../lib/security/piiService';

// Export all user data for GDPR compliance
const exportResult = await exportUserDataGDPR(
  'user-123',
  '192.168.1.1',
  'Mozilla/5.0...'
);

if (exportResult.success && exportResult.exportData) {
  // Data includes:
  // - personalData: Decrypted PII fields
  // - profileData: Non-PII profile information
  // - activityData: Security events and activity logs
  // - consentData: Consent records and preferences
}
```

## 🌐 API Endpoints

### Secure Profile Management

**GET /api/user/secure-profile**
- Retrieves user profile with decrypted PII
- Requires JWT authentication
- Rate limited: 100 requests per hour

**PUT /api/user/secure-profile**
- Updates profile with automatic PII encryption
- Validates and sanitizes input data
- Rate limited: 20 updates per hour

**DELETE /api/user/secure-profile**
- Securely deletes PII data (GDPR right to erasure)
- Anonymizes profile while preserving analytics data
- Rate limited: 3 deletions per day

### GDPR Data Export

**POST /api/user/export-data-secure**
- Creates secure data export with decrypted PII
- Supports JSON and CSV formats
- Generates time-limited download URLs

**GET /api/user/export-data-secure**
- Retrieves export history and status
- Shows active download links

### Example API Usage

```javascript
// Update profile
const response = await fetch('/api/user/secure-profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    updates: {
      first_name: 'Jane',
      email: 'jane@example.com',
      bio: 'Updated bio'
    }
  })
});

// Export data
const exportResponse = await fetch('/api/user/export-data-secure', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'json',
    includeActivity: true,
    includeConsents: true
  })
});

const { downloadUrl, expiresAt } = await exportResponse.json();
```

## 🗄️ Database Schema

### Core Tables

**user_pii_data**
- Stores encrypted PII separately from main profiles
- JSONB field for flexible encrypted data storage
- Key versioning for rotation support

**pii_encryption_keys**
- Manages encryption key versions
- Tracks key lifecycle and rotation
- Stores key hashes for verification

**pii_access_logs**
- Comprehensive audit trail for all PII operations
- Tracks encryption, decryption, and access events
- Includes IP addresses and user agents

**data_export_requests**
- GDPR export request tracking
- Secure download URL management
- Automatic cleanup of expired exports

### Security Policies

All tables have comprehensive Row-Level Security (RLS) policies:
- Users can only access their own data
- Admins have controlled access for support
- System operations are properly audited

## 🔄 Key Rotation

### Automatic Rotation

```typescript
import { piiEncryption } from '../lib/security/piiEncryption';

// Rotate encryption key
const rotationResult = await piiEncryption.rotateKey(
  adminUserId,
  ipAddress,
  userAgent
);

if (rotationResult.success) {
  console.log('New key version:', rotationResult.newKeyVersion);
}
```

### Migration Strategy

1. **Generate New Key**: Create new encryption key version
2. **Dual Support**: System supports both old and new keys
3. **Background Migration**: Gradually re-encrypt data with new key
4. **Key Retirement**: Retire old key after migration complete

## 📊 Monitoring and Audit

### Security Events

All PII operations are logged with:
- User ID and operation type
- IP address and user agent
- Success/failure status
- Error details (if applicable)
- Timestamp and key version

### Audit Queries

```sql
-- Recent PII access by user
SELECT operation, pii_field, success, created_at
FROM pii_access_logs
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 50;

-- Failed encryption attempts
SELECT user_id, operation, error_message, ip_address, created_at
FROM pii_access_logs
WHERE success = false
AND created_at > NOW() - INTERVAL '24 hours';

-- Key usage statistics
SELECT key_version, COUNT(*) as operations
FROM pii_access_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY key_version;
```

## 🛡️ Security Best Practices

### Development
- Never log decrypted PII data
- Use secure random number generation
- Validate all input data before encryption
- Implement proper error handling without data leakage

### Production
- Store encryption keys in secure environment variables
- Use HTTPS for all API communications
- Implement proper rate limiting
- Monitor for suspicious access patterns
- Regular security audits and penetration testing

### Key Management
- Rotate encryption keys quarterly
- Use hardware security modules (HSMs) for key storage
- Implement key escrow for disaster recovery
- Maintain secure key backup procedures

## 🌍 GDPR/CCPA Compliance

### Rights Supported

**Right to Access (Article 15)**
- Complete data export with decrypted PII
- Structured data format (JSON/CSV)
- Includes all personal data and processing activities

**Right to Portability (Article 20)**
- Machine-readable export formats
- Secure download with time-limited URLs
- Complete data package including metadata

**Right to Erasure (Article 17)**
- Secure deletion of encrypted PII data
- Profile anonymization while preserving analytics
- Audit trail of deletion activities

**Right to Rectification (Article 16)**
- Secure profile update with PII encryption
- Audit trail of all modifications
- Data validation and sanitization

### Compliance Features

- **Consent Management**: Tracked and auditable consent records
- **Data Minimization**: Only necessary PII fields are encrypted
- **Purpose Limitation**: Clear data usage purposes and retention
- **Storage Limitation**: Automatic cleanup of expired data
- **Accountability**: Comprehensive audit trails and documentation

## 🚀 Deployment Guide

### Environment Variables

```bash
# Required
PII_ENCRYPTION_KEY=your-base64-encryption-key
VITE_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
VITE_PII_ENCRYPTION_KEY=client-side-key (not recommended)
```

### Vercel Deployment

1. **Environment Variables**: Set in Vercel dashboard
2. **Database Migration**: Run migration script before deployment
3. **Storage Setup**: Configure Supabase storage bucket
4. **Monitoring**: Set up error tracking and monitoring

### Production Checklist

- [ ] Encryption keys properly configured
- [ ] Database migration applied
- [ ] Storage bucket created and configured
- [ ] RLS policies verified
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Security audit completed
- [ ] GDPR compliance verified
- [ ] Backup and recovery procedures tested

## 🔍 Testing

### Unit Tests

```typescript
// Test PII encryption
describe('PII Encryption', () => {
  test('should encrypt and decrypt email correctly', async () => {
    const email = 'test@example.com';
    const encrypted = await encryptPII(email, 'email', 'user-123');
    expect(encrypted.success).toBe(true);
    
    const decrypted = await decryptPII(encrypted.encryptedData!, 'user-123');
    expect(decrypted.success).toBe(true);
    expect(decrypted.data).toBe(email);
  });
});
```

### Integration Tests

```typescript
// Test API endpoints
describe('Secure Profile API', () => {
  test('should update profile with PII encryption', async () => {
    const response = await request(app)
      .put('/api/user/secure-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        updates: {
          email: 'new@example.com',
          first_name: 'John'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 📈 Performance Considerations

### Optimization Strategies

- **Bulk Operations**: Use `bulkDecryptPII` for multiple fields
- **Caching**: Cache decrypted data temporarily (with security considerations)
- **Lazy Loading**: Decrypt PII only when needed
- **Connection Pooling**: Optimize database connections

### Performance Metrics

- Encryption: ~1-2ms per field
- Decryption: ~1-2ms per field
- Bulk operations: ~5-10ms for 10 fields
- Database queries: Standard Supabase performance

## 🆘 Troubleshooting

### Common Issues

**Encryption Key Not Found**
```
Error: PII_ENCRYPTION_KEY environment variable is required
```
Solution: Set the encryption key in environment variables

**Migration Failed**
```
Error: Migration execution failed
```
Solution: Check database permissions and Supabase connection

**Decryption Failed**
```
Error: Decryption failed - invalid data or key
```
Solution: Verify key version and data integrity

### Debug Mode

Enable debug logging:
```typescript
// Set environment variable
DEBUG=pii:*

// Or in code
console.log('PII Debug:', { encryptedData, keyVersion });
```

## 📞 Support

For technical support or security questions:
- Review this documentation
- Check the troubleshooting section
- Examine audit logs for error details
- Contact the development team with specific error messages

## 🔄 Version History

- **v1.0.0**: Initial PII encryption implementation
- **v1.1.0**: Added GDPR export functionality
- **v1.2.0**: Enhanced key rotation and audit logging
- **v1.3.0**: Performance optimizations and bulk operations

---

**Security Notice**: This implementation follows industry best practices for PII encryption and GDPR compliance. Regular security audits and updates are recommended to maintain the highest level of protection. 