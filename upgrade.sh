#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <NX_VER> [version_bump] [start_step]"
  exit 1
fi

NX_VER=$1
VERSION_BUMP=${2:-}
START_STEP=${3:-1}

commit_all_changes() {
  local message=$1

  git add -A
  git commit -m "$message"
}

commit_all_changes_if_any() {
  local message=$1

  git add -A
  if git diff --cached --quiet; then
    echo "No changes to commit for: $message"
    return 0
  fi

  git commit -m "$message"
}

confirm_continue_after_audit_failure() {
  echo "npm audit fix failed. Review the issue above."
  read -p "Press 'C' to ignore this problem and continue: " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Cc]$ ]]; then
    echo "Script aborted by user."
    exit 1
  fi
}

if [ -z "$VERSION_BUMP" ]; then
  read -p "Enter version bump type (major, minor, patch or specific version): " VERSION_BUMP
fi

echo "Starting NX upgrade to version $NX_VER from step $START_STEP..."
step=1

if [ $step -ge $START_STEP ]; then
  echo "Step 1: Checking out new branch 'chore/nx-upgrade-$NX_VER'"
  git checkout -b chore/nx-upgrade-$NX_VER || { echo "Error: git checkout failed"; exit 1; }
fi
step=2

if [ $step -ge $START_STEP ]; then
  echo "Step 2: Migrating NX to latest"
  npx nx migrate latest || { echo "Error: nx migrate latest failed"; exit 1; }
fi
step=3

if [ $step -ge $START_STEP ]; then
  echo "Step 3: Installing npm packages"
  npm install || { echo "Error: npm install failed"; exit 1; }
fi
step=4

if [ $step -ge $START_STEP ]; then
  echo "Step 4: Running NX migrations"
  npx nx migrate --run-migrations || { echo "Error: nx run migrations failed"; exit 1; }
fi
step=5

if [ $step -ge $START_STEP ]; then
  echo "Step 5: Formatting with NX"
  npx nx format || { echo "Error: nx format failed"; exit 1; }
fi
step=6

if [ $step -ge $START_STEP ]; then
  echo "Step 6: Committing NX upgrade changes"
  commit_all_changes "chore: nx upgrade to $NX_VER" || { echo "Error: git commit failed"; exit 1; }
fi
step=7

if [ $step -ge $START_STEP ]; then
  echo "Step 7: Checking for outdated packages..."
  npm outdated || echo "npm outdated found some outdated packages. Please review above."
fi
step=8

if [ $step -ge $START_STEP ]; then
  echo "Step 8: Awaiting review confirmation"
  read -p "Review changes and press 'C' to continue: " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Cc]$ ]]; then
    echo "Script aborted by user."
    exit 1
  fi
fi
step=9

if [ $step -ge $START_STEP ]; then
  echo "Step 9: Updating npm packages and fixing audits"
  npm update || { echo "Error: npm update failed"; exit 1; }
  npm audit fix || confirm_continue_after_audit_failure
fi
step=10

if [ $step -ge $START_STEP ]; then
  echo "Step 10: Committing dependency updates"
  commit_all_changes "chore: deps updated" || { echo "Error: git commit failed"; exit 1; }
fi
step=11

if [ $step -ge $START_STEP ]; then
  echo "Step 11: Autofixing lint issues and committing"
  npx nx affected:lint --fix || { echo "Error: linting failed"; exit 1; }
  npx nx format
  commit_all_changes_if_any "chore: fix lint issues" || { echo "Error: git commit failed"; exit 1; }
fi
step=12

if [ $step -ge $START_STEP ]; then
  echo "Step 12: Running build, typecheck:specs, tests, and e2e tests"
  npx nx affected:build || { echo "Error: build failed"; exit 1; }
  npx nx affected -t typecheck:specs || { echo "Error: typecheck:specs failed"; exit 1; }
  npx nx affected:test || { echo "Error: tests failed"; exit 1; }

  echo "Running e2e tests..."
  npx nx affected:e2e --parallel=1 || { echo "Error: e2e tests failed"; exit 1; }

  echo "Verifying there are no changes in the working directory now..."
  if [ -n "$(git status --porcelain)" ]; then
    echo "Error: There are uncommitted changes in the working directory."
    git status
    exit 1
  fi
fi
step=13

if [ $step -ge $START_STEP ]; then
  echo "Step 13: Bumping versions for azure-func and upgrade-verify packages"
  cd packages/azure-func && npm version $VERSION_BUMP || { echo "Error: version bump in azure-func failed"; exit 1; }
  cd ../..
  cd packages/upgrade-verify && npm version $VERSION_BUMP || { echo "Error: version bump in upgrade-verify failed"; exit 1; }
  cd ../..
fi
step=14

if [ $step -ge $START_STEP ]; then
  echo "Step 14: Checking @azure/functions version"
  echo "Please check the version of @azure/functions at https://github.com/Azure/azure-functions-nodejs-library"
  echo "If needed, make changes in:"
  echo "  - packages/azure-func/src/generators/application/generator.spec.ts"
  echo "  - packages/azure-func/src/generators/application/generator.ts"
  echo "  - packages/azure-func/migrations.json"
  read -p "Press 'C' to continue once changes are made: " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Cc]$ ]]; then
    echo "Script aborted by user."
    exit 1
  fi
fi
step=15

if [ $step -ge $START_STEP ]; then
  echo "Step 15: Awaiting changelog updates"
  read -p "Please update changelogs if necessary. Press 'C' to continue once changelogs are updated: " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Cc]$ ]]; then
    echo "Script aborted by user."
    exit 1
  fi
fi
step=16

if [ $step -ge $START_STEP ]; then
  echo "Step 16: Running format check"
  npx nx format:check || { echo "Error: nx format:check failed"; exit 1; }
fi
step=17

if [ $step -ge $START_STEP ]; then
  echo "Step 17: Committing package version bumps"
  commit_all_changes "chore: package versions bumped" || { echo "Error: git commit failed"; exit 1; }
fi
step=18

if [ $step -ge $START_STEP ]; then
  echo "NX upgrade to version $NX_VER completed successfully!"
fi
