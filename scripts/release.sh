#!/bin/bash
set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== HTTP Context Middleware Release Script ===${NC}"

# Check if user is logged in to npm
npm_user=$(npm whoami 2>/dev/null || echo "")
if [ -z "$npm_user" ]; then
  echo -e "${RED}Error: You are not logged in to npm. Please run 'npm login' first.${NC}"
  exit 1
fi
echo -e "${GREEN}Logged in to npm as: ${npm_user}${NC}"

# Parse arguments
release_type=""
while [[ "$#" -gt 0 ]]; do
  case $1 in
    major|minor|patch) release_type="$1"; shift ;;
    *) echo -e "${RED}Unknown parameter: $1${NC}"; exit 1 ;;
  esac
done

# Ensure a release type was provided
if [ -z "$release_type" ]; then
  echo -e "${YELLOW}Usage: $0 <major|minor|patch>${NC}"
  echo "Example: $0 patch"
  exit 1
fi

# Make sure we're on main/master branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
  echo -e "${YELLOW}Warning: You are not on the main/master branch.${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}Warning: You have uncommitted changes.${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Get current version
current_version=$(node -p "require('./package.json').version")
echo -e "${GREEN}Current version: ${current_version}${NC}"

# Run lint and tests
echo -e "${GREEN}Running linting...${NC}"
npm run lint

echo -e "${GREEN}Running tests...${NC}"
npm test

# Build the package
echo -e "${GREEN}Building package...${NC}"
npm run build

# Bump version
echo -e "${GREEN}Bumping ${release_type} version...${NC}"
npm version $release_type --no-git-tag-version

# Get new version
new_version=$(node -p "require('./package.json').version")
echo -e "${GREEN}New version: ${new_version}${NC}"

# Commit changes
echo -e "${GREEN}Committing version bump...${NC}"
git add package.json package-lock.json
git commit -m "chore(release): bump version to ${new_version}"

# Create Git tag
echo -e "${GREEN}Creating git tag v${new_version}...${NC}"
git tag -a "v${new_version}" -m "Release v${new_version}"

# Push to GitHub
echo -e "${GREEN}Pushing to GitHub...${NC}"
read -p "Push to GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git push origin "$current_branch"
  git push --tags
  echo -e "${GREEN}Successfully pushed to GitHub.${NC}"
else
  echo -e "${YELLOW}Skipped pushing to GitHub.${NC}"
fi

# Publish to npm
echo -e "${GREEN}Publishing to npm...${NC}"
read -p "Publish to npm? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm publish --access public
  echo -e "${GREEN}Successfully published to npm!${NC}"
else
  echo -e "${YELLOW}Skipped publishing to npm.${NC}"
fi

echo -e "${GREEN}Release process completed successfully!${NC}"
echo -e "${GREEN}Summary:${NC}"
echo -e "  - Version: ${current_version} -> ${new_version}"
echo -e "  - Git tag: v${new_version}"
echo -e "  - npm package: @zakyyudha/http-context-middleware@${new_version}"
