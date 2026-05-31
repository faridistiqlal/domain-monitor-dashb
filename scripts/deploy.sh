#!/bin/bash

# Domain Monitor - Quick Deploy Script
# Mempermudah workflow: update version → commit → push

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          🚀 Domain Monitor - Quick Deploy Script 🚀                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get current version
CURRENT_VERSION=$(grep -oP "APP_VERSION = '\K[^']+" src/lib/version.ts)
echo -e "${BLUE}Current version:${NC} ${GREEN}${CURRENT_VERSION}${NC}"
echo ""

# Prompt for new version
echo -e "${YELLOW}Enter new version (e.g., 3.0.1, 3.1.0):${NC}"
read -p "> " NEW_VERSION

# Validate version format
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format! Use: MAJOR.MINOR.PATCH (e.g., 3.0.1)${NC}"
    exit 1
fi

echo ""

# Prompt for commit message
echo -e "${YELLOW}Enter commit message (e.g., 'feat: add new feature'):${NC}"
read -p "> " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    echo -e "${RED}❌ Commit message cannot be empty!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 Summary:${NC}"
echo -e "  Version: ${CURRENT_VERSION} → ${NEW_VERSION}"
echo -e "  Commit: ${COMMIT_MSG}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Confirm
read -p "$(echo -e ${YELLOW}Proceed with deployment? [y/N]: ${NC})" -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔄 Starting deployment...${NC}"
echo ""

# Step 1: Update version
echo -e "${YELLOW}[1/5]${NC} Updating version..."
cat > src/lib/version.ts << EOF
/**
 * Application Version
 * Increment this version number with every deployment to Vercel
 * This ensures localStorage migration runs and users get the latest updates
 */
export const APP_VERSION = '${NEW_VERSION}'
EOF
echo -e "${GREEN}✓ Version updated to ${NEW_VERSION}${NC}"

# Step 2: Test build (optional, comment out if too slow)
# echo -e "${YELLOW}[2/5]${NC} Testing build..."
# npm run build > /dev/null 2>&1
# echo -e "${GREEN}✓ Build successful${NC}"

# Step 2: Stage changes
echo -e "${YELLOW}[2/5]${NC} Staging changes..."
git add .
echo -e "${GREEN}✓ Changes staged${NC}"

# Step 3: Commit
echo -e "${YELLOW}[3/5]${NC} Committing..."
git commit -m "${COMMIT_MSG} (v${NEW_VERSION})"
echo -e "${GREEN}✓ Committed${NC}"

# Step 4: Push to GitHub
echo -e "${YELLOW}[4/5]${NC} Pushing to GitHub..."
git push
echo -e "${GREEN}✓ Pushed to GitHub${NC}"

# Step 5: Done
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment initiated successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Wait 1-2 minutes for Vercel auto-deploy"
echo -e "  2. Check: ${BLUE}https://domain-watchtower.vercel.app${NC}"
echo -e "  3. Verify footer shows: ${GREEN}v${NEW_VERSION}${NC}"
echo ""
echo -e "${YELLOW}Deployment status:${NC}"
echo -e "  ${BLUE}https://vercel.com/farid-istiqlals-projects/monitoring-domain-bulk${NC}"
echo ""
