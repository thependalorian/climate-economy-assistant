# DNS Configuration Guide for cea.georgenekwaya.com

## Quick Setup Steps

### 1. Access Your Domain Registrar
Log into the control panel where you manage `georgenekwaya.com` (e.g., GoDaddy, Namecheap, Cloudflare, etc.)

### 2. Add CNAME Record
Navigate to DNS Management and add:

```
Type: CNAME
Name: cea
Value: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

### 3. Alternative A Record (if CNAME not supported)
If your registrar doesn't support CNAME for subdomains:

```
Type: A
Name: cea
Value: 76.76.19.61
TTL: 3600
```

### 4. Verify DNS Propagation
After adding the record, check propagation:

```bash
# Check if DNS is working
nslookup cea.georgenekwaya.com

# Or use online tools
# https://dnschecker.org/
```

## Common DNS Providers

### Cloudflare
1. Go to DNS tab
2. Click "Add record"
3. Select CNAME
4. Name: `cea`
5. Target: `cname.vercel-dns.com`
6. Proxy status: DNS only (gray cloud)

### GoDaddy
1. Go to DNS Management
2. Click "Add"
3. Type: CNAME
4. Host: `cea`
5. Points to: `cname.vercel-dns.com`
6. TTL: 1 Hour

### Namecheap
1. Go to Advanced DNS
2. Click "Add New Record"
3. Type: CNAME Record
4. Host: `cea`
5. Value: `cname.vercel-dns.com`
6. TTL: Automatic

### Google Domains
1. Go to DNS
2. Click "Manage custom records"
3. Create new record:
   - Type: CNAME
   - Name: `cea`
   - Data: `cname.vercel-dns.com`

## Verification Commands

```bash
# Check if subdomain resolves
dig cea.georgenekwaya.com

# Check CNAME record specifically
dig cea.georgenekwaya.com CNAME

# Test HTTP response
curl -I https://cea.georgenekwaya.com
```

## Troubleshooting

### DNS Not Propagating
- Wait 24-48 hours for full propagation
- Clear your local DNS cache:
  ```bash
  # macOS
  sudo dscacheutil -flushcache
  
  # Windows
  ipconfig /flushdns
  
  # Linux
  sudo systemctl restart systemd-resolved
  ```

### SSL Certificate Issues
- Vercel automatically provisions SSL certificates
- May take 5-10 minutes after DNS propagation
- Check certificate status in Vercel dashboard

### CNAME vs A Record
- **Use CNAME** if your provider supports it (recommended)
- **Use A Record** only if CNAME is not supported
- Never use both for the same subdomain

## Post-DNS Configuration

After DNS is working:

1. **Verify Vercel Deployment**
   ```bash
   vercel domains ls
   ```

2. **Test Email Confirmations**
   - Register a test account
   - Check email links point to new domain

3. **Update Supabase Settings**
   - Site URL: `https://cea.georgenekwaya.com`
   - Redirect URLs updated

4. **Test Cross-Domain Analytics**
   - Verify tracking between main site and CEA platform

## Security Considerations

### SSL/TLS
- Vercel provides automatic SSL certificates
- Force HTTPS redirects are enabled
- HSTS headers configured

### DNS Security
- Consider enabling DNSSEC if supported
- Use DNS over HTTPS (DoH) for queries
- Monitor for DNS hijacking

## Monitoring

Set up monitoring for:
- Domain resolution
- SSL certificate expiration
- Website uptime
- Performance metrics

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify DNS configuration
3. Test from different networks
4. Contact domain registrar support if needed

---

**Next Steps**: Once DNS is configured, proceed with the Supabase configuration updates in `SUBDOMAIN_DEPLOYMENT_GUIDE.md` 