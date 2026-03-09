# Quick Start Guide

Get your WhatsApp bot running on Clever Cloud in 10 minutes!

## 🚀 Super Fast Deployment

### 1. Get the Code (30 seconds)

```bash
git clone <your-repo-url>
cd whatsapp-bot-clevercloud
```

### 2. Deploy to Clever Cloud (5 minutes)

#### Option A: GitHub (Easiest - No CLI needed)

1. Push code to GitHub
2. Go to [Clever Cloud Console](https://console.clever-cloud.com)
3. Click **Create** → **Node.js app**
4. Connect GitHub → Select your repo
5. Click **Create** → Wait for deployment
6. Done! 🎉

#### Option B: CLI (For developers)

```bash
npm install -g clever-tools
clever login
clever create --type node whatsapp-bot
clever deploy
```

### 3. Pair WhatsApp (2 minutes)

1. Visit: `https://your-app.cleverapps.io/pair`
2. Enter your phone number (with country code)
3. Click **Get Pairing Code**
4. Open WhatsApp → Settings → Linked Devices
5. Tap **Link a Device** → **Link with Phone Number**
6. Enter the 6-digit code
7. Connected! ✅

### 4. Test Your Bot (1 minute)

Send a message to your WhatsApp:

```
.ping
```

Bot should reply:
```
🏓 Pong! Bot is active and running.
```

## 📱 Basic Commands

| Command | Description |
|---------|-------------|
| `.ping` | Check if bot is online |
| `.help` | Show available commands |
| `.about` | Bot information |

## ⚙️ Essential Configuration

Set these environment variables in Clever Cloud:

```bash
PORT=8080
NODE_ENV=production
BOT_NAME=Your Bot Name
OWNER_NUMBER=your_phone_number
PREFIX=.
```

## 🔗 Important URLs

- **Main Dashboard**: `https://your-app.cleverapps.io/`
- **Pair Device**: `https://your-app.cleverapps.io/pair`
- **Health Check**: `https://your-app.cleverapps.io/health`
- **API Status**: `https://your-app.cleverapps.io/api/bot/status`

## 💡 Pro Tips

1. **Custom Domain**: Add your domain in Clever Cloud dashboard
2. **Scaling**: Enable autoscaling for high traffic
3. **Monitoring**: Check logs with `clever logs -f`
4. **Backup**: Download sessions regularly from dashboard

## 🆘 Quick Troubleshooting

**Bot not responding?**
- Check `/health` endpoint
- View logs: `clever logs`
- Restart app in dashboard

**Pairing failed?**
- Ensure phone number has country code
- Check WhatsApp is updated
- Try again with new code

**App won't deploy?**
- Check `package.json` engines
- Verify all files are committed
- Review deployment logs

## 📚 Next Steps

- [Full Documentation](README.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](README.md#api-documentation)

## 🎯 That's It!

You now have a fully functional WhatsApp bot running on Clever Cloud!

### Want More Features?

The bot is ready to be extended:
- Add custom commands
- Integrate databases
- Connect webhooks
- Build admin panel
- Add analytics

Check the [README](README.md) for advanced configuration.

---

**Need Help?** Open an issue on GitHub or check Clever Cloud docs.

**Happy botting!** 🤖✨
