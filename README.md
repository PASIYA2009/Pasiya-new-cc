# WhatsApp Bot - Clever Cloud Edition

[![Deploy to Clever Cloud](https://img.shields.io/badge/Deploy%20to-Clever%20Cloud-3A93D5)](https://www.clever-cloud.com)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An advanced WhatsApp bot with Business API support, optimized for deployment on Clever Cloud. Features ultra-fast pairing, multi-device support, and comprehensive API endpoints.

## ✨ Features

- ⚡ **Fast Pairing**: Connect WhatsApp in 30-60 seconds using pairing codes
- 🔒 **Secure**: Session encryption and secure credential storage
- 📲 **Multi-Device**: Support for multiple WhatsApp accounts simultaneously
- 💼 **Business API Ready**: Prepared for WhatsApp Business API integration
- 🚀 **Clever Cloud Optimized**: Auto-scaling, health checks, and monitoring
- 🔄 **Auto-Reconnect**: Automatic reconnection on connection loss
- 📝 **Message Logging**: Comprehensive logging with Pino
- 🛡️ **Rate Limiting**: Built-in API rate limiting
- 🎨 **Modern UI**: Beautiful web interface for bot management

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd whatsapp-bot-clevercloud
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

### Clever Cloud Deployment

#### Prerequisites
- A Clever Cloud account ([Sign up here](https://www.clever-cloud.com))
- Clever Cloud CLI installed ([Installation guide](https://www.clever-cloud.com/doc/clever-tools/getting_started/))

#### Deployment Steps

1. **Login to Clever Cloud**
   ```bash
   clever login
   ```

2. **Create a Node.js application**
   ```bash
   clever create --type node whatsapp-bot
   ```

3. **Set environment variables**
   ```bash
   clever env set PORT 8080
   clever env set NODE_ENV production
   clever env set BOT_NAME "Your Bot Name"
   clever env set OWNER_NUMBER "your_number"
   ```

4. **Deploy the application**
   ```bash
   git add .
   git commit -m "Initial deployment"
   clever deploy
   ```

5. **Open your application**
   ```bash
   clever open
   ```

## 📱 How to Pair Your WhatsApp

### Method 1: Using Pairing Code (Recommended - Fastest)

1. Visit `https://your-app-url.cleverapps.io/pair`
2. Enter your phone number with country code (e.g., `94741856766`)
3. Click "Get Pairing Code"
4. Open WhatsApp on your phone
5. Go to **Settings** → **Linked Devices** → **Link a Device**
6. Choose **Link with Phone Number**
7. Enter the 6-digit code displayed
8. Wait for connection (typically 30-60 seconds)

### Method 2: Using QR Code

1. Visit the API endpoint: `/api/pair/qr?phone=your_number`
2. Scan the QR code with WhatsApp
3. Connection established

## 🔌 API Documentation

### Base URL
```
https://your-app-url.cleverapps.io
```

### Authentication
Currently, the API is open. For production, implement your preferred authentication method.

### Endpoints

#### Pairing Endpoints

##### Generate Pairing Code
```http
POST /api/pair/code
Content-Type: application/json

{
  "phoneNumber": "94741856766"
}
```

**Response:**
```json
{
  "success": true,
  "pairingCode": "ABC123",
  "phoneNumber": "94741856766",
  "sessionId": "session_94741856766",
  "message": "Enter this code in WhatsApp"
}
```

##### Check Pairing Status
```http
GET /api/pair/status/:sessionId
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_94741856766",
  "paired": true,
  "phoneNumber": "94741856766",
  "createdAt": 1234567890,
  "connectedAt": 1234567900
}
```

##### List All Sessions
```http
GET /api/pair/sessions
```

##### Delete Session
```http
DELETE /api/pair/session/:sessionId
```

#### Bot Control Endpoints

##### Start Bot
```http
POST /api/bot/start
Content-Type: application/json

{
  "sessionId": "session_94741856766"
}
```

##### Stop Bot
```http
POST /api/bot/stop
Content-Type: application/json

{
  "sessionId": "session_94741856766"
}
```

##### Get Bot Status
```http
GET /api/bot/status
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "instances": [
    {
      "sessionId": "session_94741856766",
      "isActive": true,
      "connectedAt": 1234567890,
      "uptime": 3600000
    }
  ]
}
```

##### Send Message
```http
POST /api/bot/send
Content-Type: application/json

{
  "sessionId": "session_94741856766",
  "to": "94741856766",
  "message": "Hello from bot!",
  "type": "text"
}
```

Message types: `text`, `image`, `video`

#### Health Check Endpoints

##### General Health
```http
GET /health
```

##### Readiness Probe
```http
GET /health/ready
```

##### Liveness Probe
```http
GET /health/live
```

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment | `production` |
| `BOT_NAME` | Bot name | `PASIYA-MD` |
| `PREFIX` | Command prefix | `.` |
| `OWNER_NUMBER` | Owner phone number | - |
| `AUTO_VIEW_STATUS` | Auto view statuses | `true` |
| `AUTO_LIKE_STATUS` | Auto like statuses | `true` |
| `AUTO_RECORDING` | Show recording status | `true` |
| `PAIRING_TIMEOUT` | Pairing timeout (ms) | `60000` |
| `MAX_PAIRING_ATTEMPTS` | Max pairing attempts | `3` |

## 📊 Monitoring

### Clever Cloud Metrics

The application is configured with health check endpoints that Clever Cloud uses for monitoring:

- **Liveness**: `/health/live` - Checks if the app is running
- **Readiness**: `/health/ready` - Checks if the app is ready to receive traffic

### Logs

View logs in real-time:
```bash
clever logs
```

## 🔧 Advanced Configuration

### WhatsApp Business API Integration

To integrate with WhatsApp Business API:

1. Set environment variables:
   ```bash
   clever env set WHATSAPP_BUSINESS_API_URL "your_api_url"
   clever env set WHATSAPP_BUSINESS_API_TOKEN "your_token"
   clever env set WHATSAPP_BUSINESS_PHONE_NUMBER_ID "your_phone_id"
   ```

2. The bot will automatically use Business API when credentials are provided

### Session Persistence

Sessions are stored in the `./session` directory. For production:

1. Consider using a database for session storage
2. Implement session backup to cloud storage
3. Use environment variables for sensitive data

### Scaling

Clever Cloud automatically scales your application. Configure scaling rules in the dashboard:

- **Horizontal Scaling**: Add more instances during high load
- **Vertical Scaling**: Increase instance size for better performance

## 🐛 Troubleshooting

### Pairing Issues

**Problem**: Pairing code not working
- **Solution**: Ensure phone number includes country code
- **Solution**: Check if WhatsApp is updated to latest version

**Problem**: Connection timeout
- **Solution**: Increase `PAIRING_TIMEOUT` environment variable
- **Solution**: Check network connectivity

### Deployment Issues

**Problem**: App not starting on Clever Cloud
- **Solution**: Check logs with `clever logs`
- **Solution**: Verify Node.js version in `package.json`
- **Solution**: Ensure all environment variables are set

**Problem**: Session not persisting
- **Solution**: Check file system permissions
- **Solution**: Consider using external storage for sessions

## 📝 Development

### Project Structure

```
whatsapp-bot-clevercloud/
├── index.js              # Main application entry
├── routes/
│   ├── pair.js          # Pairing endpoints
│   ├── bot.js           # Bot control endpoints
│   └── health.js        # Health check endpoints
├── public/
│   ├── index.html       # Main dashboard
│   └── pair.html        # Pairing interface
├── session/             # Session storage
├── clevercloud/
│   └── nodejs.json      # Clever Cloud config
├── package.json
├── Procfile            # Process configuration
└── README.md
```

### Adding New Features

1. Create new route in `routes/` directory
2. Import and use in `index.js`
3. Update API documentation
4. Test locally before deploying

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Clever Cloud](https://www.clever-cloud.com) - Cloud platform
- Original bot by PASIYA BOY

## 📞 Support

For issues and questions:

- Open an issue on GitHub
- Check existing documentation
- Review Clever Cloud docs

## 🔮 Roadmap

- [ ] Database integration for sessions
- [ ] Advanced message filtering
- [ ] Plugin system
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Multi-language support
- [ ] Webhook integration
- [ ] Custom command builder

---

**Made with ❤️ for the community**

**Enhanced for Clever Cloud deployment**
