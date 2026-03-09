# Clever Cloud Deployment Guide

This guide will walk you through deploying your WhatsApp bot to Clever Cloud step-by-step.

## Prerequisites

1. **Clever Cloud Account**
   - Sign up at [https://www.clever-cloud.com](https://www.clever-cloud.com)
   - Verify your email address

2. **Git Installed**
   - Download from [https://git-scm.com](https://git-scm.com)
   - Verify installation: `git --version`

3. **Clever Cloud CLI (Optional but Recommended)**
   - Install: `npm install -g clever-tools`
   - Or download from [https://github.com/CleverCloud/clever-tools](https://github.com/CleverCloud/clever-tools)

## Deployment Method 1: Using Clever Cloud Dashboard (Easiest)

### Step 1: Push Code to GitHub

1. Create a new repository on GitHub
2. Initialize git in your project:
   ```bash
   cd whatsapp-bot-clevercloud
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. Add remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create Application on Clever Cloud

1. Log in to [Clever Cloud Console](https://console.clever-cloud.com)

2. Click **"Create"** → **"an application"**

3. Select **Node.js** runtime

4. Choose deployment method:
   - Select **"GitHub"**
   - Authorize Clever Cloud to access your repositories
   - Select your repository
   - Choose branch: `main`

5. Configure application:
   - **Application name**: `whatsapp-bot` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Instance size**: Start with **XS** (can scale later)

6. Click **"Create"**

### Step 3: Configure Environment Variables

1. In your application dashboard, go to **"Environment Variables"**

2. Add the following variables:
   ```
   PORT=8080
   NODE_ENV=production
   BOT_NAME=Your Bot Name
   PREFIX=.
   OWNER_NUMBER=your_phone_number
   AUTO_VIEW_STATUS=true
   AUTO_LIKE_STATUS=true
   AUTO_RECORDING=true
   ```

3. Click **"Update"**

### Step 4: Deploy

1. Click **"Deploy"** button or it will auto-deploy on push

2. Monitor deployment in **"Deployment logs"**

3. Wait for deployment to complete (usually 2-5 minutes)

4. Your app will be available at: `https://app-xxx.cleverapps.io`

## Deployment Method 2: Using Clever Cloud CLI (Advanced)

### Step 1: Install and Configure CLI

```bash
# Install CLI
npm install -g clever-tools

# Login
clever login

# Link your application
cd whatsapp-bot-clevercloud
clever create --type node whatsapp-bot --region par
```

### Step 2: Configure Environment

```bash
# Set environment variables
clever env set PORT 8080
clever env set NODE_ENV production
clever env set BOT_NAME "Your Bot Name"
clever env set PREFIX "."
clever env set OWNER_NUMBER "your_phone_number"
clever env set AUTO_VIEW_STATUS true
clever env set AUTO_LIKE_STATUS true
clever env set AUTO_RECORDING true
```

### Step 3: Deploy

```bash
# Commit your code
git add .
git commit -m "Deploy to Clever Cloud"

# Deploy
clever deploy

# Monitor logs
clever logs -f
```

### Step 4: Open Application

```bash
clever open
```

## Post-Deployment Configuration

### 1. Test Health Endpoints

```bash
# Check if app is running
curl https://your-app-url.cleverapps.io/health

# Should return:
# {"status":"healthy","timestamp":"..."}
```

### 2. Pair Your WhatsApp

1. Visit: `https://your-app-url.cleverapps.io/pair`
2. Enter your phone number
3. Get pairing code
4. Enter code in WhatsApp (Settings → Linked Devices → Link with Phone Number)
5. Wait for connection (30-60 seconds)

### 3. Verify Bot Status

Visit: `https://your-app-url.cleverapps.io/api/bot/status`

Should return:
```json
{
  "success": true,
  "count": 0,
  "instances": []
}
```

## Scaling Configuration

### Horizontal Scaling

1. Go to **"Scalability"** in dashboard
2. Set minimum and maximum instances
3. Configure autoscaling triggers

### Vertical Scaling

1. Go to **"Scalability"**
2. Change instance size (XS, S, M, L, XL)
3. Save changes

## Custom Domain Setup

### Step 1: Add Domain in Clever Cloud

1. Go to **"Domain names"**
2. Click **"Add a domain name"**
3. Enter your domain: `bot.yourdomain.com`

### Step 2: Configure DNS

Add these records to your DNS provider:

**For subdomain:**
```
CNAME bot.yourdomain.com → app-xxx.cleverapps.io
```

**For root domain:**
```
A @ → (IP provided by Clever Cloud)
```

### Step 3: Enable HTTPS

1. Clever Cloud automatically provisions SSL certificates
2. Wait 5-10 minutes for SSL to be active
3. HTTPS will be available at `https://bot.yourdomain.com`

## Monitoring and Logs

### View Logs

**Using CLI:**
```bash
# Real-time logs
clever logs -f

# Last 100 lines
clever logs --since 100
```

**Using Dashboard:**
1. Go to **"Logs"** tab
2. Select time range
3. Filter by log level

### Monitor Performance

1. Go to **"Metrics"** tab
2. View CPU, RAM, Network usage
3. Set up alerts for high usage

## Troubleshooting

### Issue: App Not Starting

**Check logs:**
```bash
clever logs
```

**Common solutions:**
- Verify `package.json` has correct `engines` field
- Check if all dependencies are in `dependencies` (not `devDependencies`)
- Ensure PORT environment variable is set

### Issue: WhatsApp Connection Failing

**Solutions:**
- Check network settings in Clever Cloud dashboard
- Verify phone number format includes country code
- Ensure WhatsApp is updated on your phone
- Try regenerating pairing code

### Issue: High Memory Usage

**Solutions:**
- Upgrade instance size
- Implement session cleanup
- Check for memory leaks in logs

### Issue: Slow Performance

**Solutions:**
- Enable horizontal scaling
- Upgrade instance size
- Check database connection if using external DB
- Review code for optimization opportunities

## Backup and Disaster Recovery

### Session Backup

**Manual backup:**
```bash
clever ssh
tar -czf session-backup.tar.gz session/
```

**Automated backup:**
- Use Clever Cloud FS Buckets addon
- Configure automatic backups in dashboard

### Database Backup (if using)

1. Add database addon (PostgreSQL, MongoDB, etc.)
2. Configure automatic backups
3. Test restore procedure

## Security Best Practices

### 1. Environment Variables

- Never commit `.env` file
- Use Clever Cloud environment variables
- Rotate sensitive credentials regularly

### 2. API Security

- Implement authentication for API endpoints
- Add rate limiting (already included)
- Use HTTPS only in production

### 3. Session Security

- Encrypt session data
- Implement session expiration
- Use secure storage (database or FS Bucket)

## Performance Optimization

### 1. Enable Compression

Already enabled in the code:
```javascript
app.use(compression());
```

### 2. Use CDN

For static assets:
1. Upload to CDN (Cloudflare, etc.)
2. Update references in HTML

### 3. Database Connection Pooling

If using database:
```javascript
// Configure connection pool
const pool = {
  min: 2,
  max: 10
};
```

## Monitoring Checklist

- [ ] Health endpoints responding
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Logs being generated
- [ ] Metrics showing normal values
- [ ] WhatsApp connected
- [ ] Bot responding to commands
- [ ] Autoscaling configured
- [ ] Backup strategy in place
- [ ] Alerts configured

## Cost Optimization

### Tips to Reduce Costs:

1. **Right-size instances**: Start small, scale as needed
2. **Use autoscaling**: Only pay for what you use
3. **Clean up old sessions**: Implement automatic cleanup
4. **Optimize database queries**: If using database
5. **Monitor usage**: Review metrics regularly

### Estimated Costs:

| Instance Size | RAM | Price/month |
|--------------|-----|-------------|
| XS | 256MB | ~€3 |
| S | 512MB | ~€6 |
| M | 1GB | ~€12 |
| L | 2GB | ~€24 |

*Prices are approximate and may vary*

## Support and Resources

### Clever Cloud Documentation
- [Node.js Documentation](https://www.clever-cloud.com/doc/nodejs/)
- [Environment Variables](https://www.clever-cloud.com/doc/admin-console/environment-variables/)
- [Custom Domains](https://www.clever-cloud.com/doc/admin-console/custom-domain-names/)

### Community Support
- [Clever Cloud Support](https://www.clever-cloud.com/support/)
- [Community Forum](https://community.clever-cloud.com/)
- [GitHub Issues](https://github.com/your-repo/issues)

## Conclusion

Your WhatsApp bot should now be successfully deployed on Clever Cloud! 

For any issues or questions, refer to:
1. This deployment guide
2. Main README.md
3. Clever Cloud documentation
4. GitHub issues

Happy deploying! 🚀
