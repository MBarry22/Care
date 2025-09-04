# SSL Certificates Directory

This directory contains SSL certificates for secure database connections.

## DigitalOcean MySQL SSL Certificate

### Setup Instructions:

1. **Download the CA certificate from DigitalOcean:**
   - Log into your DigitalOcean account
   - Go to your database cluster
   - Navigate to the "Connection Details" section
   - Download the CA certificate file

2. **Place the certificate in this directory:**
   - Rename the downloaded certificate to `ca-certificate.crt`
   - Place it in this `certs/` directory
   - The file should be located at: `./certs/ca-certificate.crt`

3. **Verify the certificate:**
   ```bash
   # Check if the certificate file exists
   ls -la certs/ca-certificate.crt
   
   # View certificate details (optional)
   openssl x509 -in certs/ca-certificate.crt -text -noout
   ```

### File Structure:
```
backend/
├── certs/
│   ├── README.md          # This file
│   └── ca-certificate.crt # DigitalOcean CA certificate (you need to add this)
├── src/
└── ...
```

### Environment Configuration:
The `.env` file should include:
```env
DB_SSL=true
DB_SSL_CA_PATH=./certs/ca-certificate.crt
```

### Security Notes:
- Never commit certificate files to version control
- Keep certificates secure and limit access
- The `certs/` directory is included in `.gitignore` to prevent accidental commits
- For production, consider using environment variables for certificate paths

### Troubleshooting:
- If you get SSL connection errors, verify the certificate path is correct
- Ensure the certificate file has proper read permissions
- Check that the certificate hasn't expired
- Verify the certificate matches your DigitalOcean database cluster
