# To upgrade to current NX

- `export NX_VER=18.0.4`
- `git checkout -b chore/nx-upgrade-$NX_VER`
- `npx nx migrate latest`
- `npm i`
- `npx nx migrate --run-migrations`
- `npx nx format`
- `git commit -am "chore: nx upgrade to $NX_VER"`
- inspect `npm outdated`
- `npm update`
- `npm audit fix`
- `git commit -am "chore: deps updated"`
- `npx nx affected:lint --fix`
- `npx nx affected:test`
- `npx nx affected:e2e --parallel=1`
- `git commit -am "chore: fix lint and tests"`
- `cd packages/azure-func && npm version minor && cd ../..`
- `cd packages/upgrade-verify && npm version minor && cd ../..`
- add changes to CHANGELOGs
- `git commit -am "chore: package versions bumped"`

Check version of @azure/functions https://github.com/Azure/azure-functions-nodejs-library

If needed:

- change in [generator.spec.ts](packages/azure-func/src/generators/application/generator.spec.ts) & [generator.ts](packages/azure-func/src/generators/application/generator.ts)
- check if any changes to generated functions needed
- add to [migrations.json](packages/azure-func/migrations.json)
- add info to changelog
- `npx nx affected:test`
- `git commit -am "feat(azure-func): upgrade @azure/functions to ???"`

To publish:

- `git push`
- on github, create and merge a PR
- create new release for each package
