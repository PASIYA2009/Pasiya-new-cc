#!/bin/bash

# WhatsApp Bot Setup Script
# This script helps you set up the bot quickly

set -e

echo "======================================"
echo "WhatsApp Bot - Setup Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed!${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm is not installed!${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm $NPM_VERSION found${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env file with your configuration${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
fi
echo ""

# Create necessary directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p session sessions public logs
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Display next steps
echo -e "${GREEN}======================================"
echo "Setup Complete! 🎉"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file with your configuration:"
echo "   nano .env"
echo ""
echo "2. Start the server:"
echo "   npm start"
echo ""
echo "3. Open browser and go to:"
echo "   http://localhost:8080/pair"
echo ""
echo "4. Deploy to Clever Cloud:"
echo "   - Follow instructions in DEPLOYMENT.md"
echo "   - Or read QUICKSTART.md for fast deployment"
echo ""
echo -e "${BLUE}For more information, see README.md${NC}"
echo ""
