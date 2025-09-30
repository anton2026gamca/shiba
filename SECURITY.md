# Security Documentation

## Overview
This document outlines the security measures implemented in the Shiba API to protect against common vulnerabilities and attacks.

## Security Measures Implemented

### 1. Input Validation and Sanitization
- **Airtable Formula Injection Protection**: Comprehensive escaping of special characters in Airtable formulas
- **Path Traversal Prevention**: Strict validation of file paths and game IDs
- **URL Validation**: Secure URL validation with protocol and hostname restrictions
- **File Upload Security**: File type and size validation for uploads

### 2. Authentication and Authorization
- **Token-based Authentication**: Secure token validation for all protected endpoints
- **Ownership Verification**: Users can only access/modify their own resources
- **Rate Limiting**: Protection against brute force attacks on login and OTP endpoints

### 3. Cryptography
- **Secure Random Generation**: Using `crypto.randomBytes()` instead of `Math.random()`
- **OTP Security**: Time-limited one-time passwords with rate limiting

### 4. File Upload Security
- **Zip Slip Prevention**: Comprehensive path validation for zip file extraction
- **File Type Restrictions**: Only allowed file types can be uploaded
- **Size Limits**: File size restrictions to prevent DoS attacks

### 5. API Security
- **Security Headers**: Comprehensive security headers including CSP, XSS protection
- **Rate Limiting**: In-memory rate limiting for critical endpoints
- **Error Handling**: Generic error messages to prevent information disclosure

### 6. Environment Security
- **Environment Variables**: Sensitive configuration moved to environment variables
- **No Hardcoded Secrets**: Removed hardcoded secrets from source code

## Security Headers Implemented

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features
- `Content-Security-Policy` - Prevents XSS and other injection attacks

## Rate Limiting

- **Login Endpoint**: 5 requests per minute per email
- **OTP Verification**: 10 attempts per 5 minutes per email
- **General API**: 100 requests per minute per IP (configurable)

## File Upload Restrictions

### Allowed File Types for Games
- HTML: `.html`, `.htm`
- CSS: `.css`
- JavaScript: `.js`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`
- Audio: `.mp3`, `.wav`, `.ogg`
- Video: `.mp4`, `.webm`
- Fonts: `.woff`, `.woff2`, `.ttf`, `.eot`
- Data: `.json`, `.xml`, `.txt`
- Icons: `.ico`, `.manifest`

### Thumbnail Upload Restrictions
- **File Types**: `.jpeg`, `.png`, `.gif`, `.webp`
- **Max Size**: 5MB
- **Protocols**: HTTPS only

## Security Best Practices

### For Developers
1. Always validate and sanitize user input
2. Use the provided security utility functions
3. Never log sensitive information
4. Use environment variables for secrets
5. Implement proper error handling

### For Deployment
1. Use HTTPS in production
2. Set up proper environment variables
3. Regularly update dependencies
4. Monitor logs for suspicious activity
5. Implement proper backup strategies

## Vulnerability Reporting

If you discover a security vulnerability, please report it responsibly:
1. Do not publicly disclose the vulnerability
2. Contact the development team privately
3. Provide detailed information about the issue
4. Allow time for the fix to be implemented

## Security Checklist

- [x] Input validation implemented
- [x] Authentication and authorization
- [x] Rate limiting
- [x] Security headers
- [x] File upload security
- [x] Path traversal prevention
- [x] SQL injection prevention (Airtable formula injection)
- [x] XSS protection
- [x] Secure random generation
- [x] Environment variable usage
- [ ] Regular security audits (recommended)
- [ ] Penetration testing (recommended)
- [ ] Security monitoring (recommended)

## Dependencies

The security implementation relies on:
- Node.js `crypto` module for secure random generation
- Next.js middleware for security headers
- Custom utility functions for input validation and sanitization

## Future Security Enhancements

1. **Redis-based Rate Limiting**: Replace in-memory rate limiting with Redis
2. **JWT Tokens**: Implement JWT for better token management
3. **API Key Rotation**: Implement automatic API key rotation
4. **Security Monitoring**: Add security event logging and alerting
5. **Regular Security Audits**: Establish regular security review process
