#!/bin/bash

# Exit on error except for npm outdated
set -e

# Check if NX_VER is passed as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <NX_VER>"
  exit 1
fi

NX_VER=$1

# Set the NX version environment variable
export NX_VER=$NX_VER

# Check if version bump type is passed, otherwise prompt for it
if [ -z "$2" ]; then
  read -p "Enter version bump type (major, minor, patch): " VERSION_BUMP
else
  VERSION_BUMP=$2
fi

if [[ ! $VERSION_BUMP =~ ^(major|minor|patch)$ ]]; then
  echo "Invalid version bump type. Must be 'major', 'minor', or 'patch'."
  exit 1
fi

# Start the upgrade process
echo "Starting NX upgrade to version $NX_VER..."

git checkout -b chore/nx-upgrade-$NX_VER || { echo "Error: git checkout failed"; exit 1; }
npx nx migrate latest || { echo "Error: nx migrate latest failed"; exit 1; }
npm install || { echo "Error: npm install failed"; exit 1; }
npx nx migrate --run-migrations || { echo "Error: nx run migrations failed"; exit 1; }
npx nx format || { echo "Error: nx format failed"; exit 1; }

git commit -am "chore: nx upgrade to $NX_VER" || { echo "Error: git commit failed"; exit 1; }

# Check outdated packages
echo "Checking for outdated packages..."
npm outdated || echo "npm outdated found some outdated packages. Please review above."

# Prompt user to continue after reviewing npm outdated
read -p "Review changes and press 'C' to continue: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Cc]$ ]]; then
  echo "Script aborted by user."
  exit 1
fi

# Update packages and audit fix
npm update || { echo "Error: npm update failed"; exit 1; }
npm audit fix || { echo "Error: npm audit fix failed"; exit 1; }

git commit -am "chore: deps updated" || { echo "Error: git commit failed"; exit 1; }

# Run lint, tests, and e2e
npx nx affected:lint --fix || { echo "Error: linting failed"; exit 1; }
npx nx affected:test || { echo "Error: tests failed"; exit 1; }
npx nx affected:e2e --parallel=1 || { echo "Error: e2e tests failed"; exit 1; }

git commit -am "chore: fix lint and tests" || { echo "Error: git commit failed"; exit 1; }

# Update versions in specific packages
cd packages/azure-func && npm version $VERSION_BUMP || { echo "Error: version bump in azure-func failed"; exit 1; }
cd ../..
cd packages/upgrade-verify && npm version $VERSION_BUMP || { echo "Error: version bump in upgrade-verify failed"; exit 1; }
cd ../..

# Prompt user to update changelogs before finalizing
read -p "Please update changelogs if necessary. Press 'C' to continue once changelogs are updated: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Cc]$ ]]; then
  echo "Script aborted by user."
  exit 1
fi

# Commit package version bumps
git commit -am "chore: package versions bumped" || { echo "Error: git commit failed"; exit 1; }

echo "NX upgrade to version $NX_VER completed successfully!"
