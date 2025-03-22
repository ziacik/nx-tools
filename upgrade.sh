#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <NX_VER> [version_bump] [start_step]"
  exit 1
fi

NX_VER=$1
VERSION_BUMP=${2:-}
START_STEP=${3:-1}

if [ -z "$VERSION_BUMP" ]; then
  read -p "Enter version bump type (major, minor, patch): " VERSION_BUMP
fi

if [[ ! $VERSION_BUMP =~ ^(major|minor|patch)$ ]]; then
  echo "Invalid version bump type. Must be 'major', 'minor', or 'patch'."
  exit 1
fi

echo "Starting NX upgrade to version $NX_VER from step $START_STEP..."
step=1

if [ $step -ge $START_STEP ]; then
  git checkout -b chore/nx-upgrade-$NX_VER || { echo "Error: git checkout failed"; exit 1; }
fi
step=2

if [ $step -ge $START_STEP ]; then
  npx nx migrate latest || { echo "Error: nx migrate latest failed"; exit 1; }
fi
step=3

if [ $step -ge $START_STEP ]; then
  npm install || { echo "Error: npm install failed"; exit 1; }
fi
step=4

if [ $step -ge $START_STEP ]; then
  npx nx migrate --run-migrations || { echo "Error: nx run migrations failed"; exit 1; }
fi
step=5

if [ $step -ge $START_STEP ]; then
  npx nx format || { echo "Error: nx format failed"; exit 1; }
fi
step=6

if [ $step -ge $START_STEP ]; then
  git commit -am "chore: nx upgrade to $NX_VER" || { echo "Error: git commit failed"; exit 1; }
fi
step=7

if [ $step -ge $START_STEP ]; then
  echo "Checking for outdated packages..."
  npm outdated || echo "npm outdated found some outdated packages. Please review above."
fi
step=8

if [ $step -ge $START_STEP ]; then
  read -p "Review changes and press 'C' to continue: " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Cc]$ ]]; then
    echo "Script aborted by user."
    exit 1
  fi
fi
step=9

if [ $step -ge $START_STEP ]; then
  npm update || { echo "Error: npm update failed"; exit 1; }
  npm audit fix || { echo "Error: npm audit fix failed"; exit 1; }
fi
step=10

if [ $step -ge $START_STEP ]; then
  git commit -am "chore: deps updated" || { echo "Error: git commit failed"; exit 1; }
fi
step=11

if [ $step -ge $START_STEP ]; then
  npx nx affected:lint --fix || { echo "Error: linting failed"; exit 1; }
  npx nx affected:test || { echo "Error: tests failed"; exit 1; }
  npx nx affected:e2e --parallel=1 || { echo "Error: e2e tests failed"; exit 1; }
fi
step=12

if [ $step -ge $START_STEP ]; then
  git commit -am "chore: fix lint and tests" || { echo "Error: git commit failed"; exit 1; }
fi
step=13

if [ $step -ge $START_STEP ]; then
  cd packages/azure-func && npm version $VERSION_BUMP || { echo "Error: version bump in azure-func failed"; exit 1; }
  cd ../..
  cd packages/upgrade-verify && npm version $VERSION_BUMP || { echo "Error: version bump in upgrade-verify failed"; exit 1; }
  cd ../..
fi
step=14

if [ $step -ge $START_STEP ]; then
  read -p "Please update changelogs if necessary. Press 'C' to continue once changelogs are updated: " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Cc]$ ]]; then
    echo "Script aborted by user."
    exit 1
  fi
fi
step=15

if [ $step -ge $START_STEP ]; then
  git commit -am "chore: package versions bumped" || { echo "Error: git commit failed"; exit 1; }
fi
step=16

if [ $step -ge $START_STEP ]; then
  echo "NX upgrade to version $NX_VER completed successfully!"
fi
