# To upgrade to current NX

- `export NX_VER=18.0.4`
- `git checkout -b git checkout -b chore/nx-upgrade-$NX_VER`
- `npm i`
- `npx nx migrate --run-migrations`
- `nx format`
- `git commit -am "chore: nx upgrate to $NX_VER"`
- inspect `npm outdated`
- `npm update`
- `git commit -am "chore: deps updated"`
- `nx affected:lint`
- `nx affected:lint --fix`
- `nx affected:test`
- `nx affected:e2e`
- `git commit -am "chore: fix lint and tests"`
- update versions of packages - minor / major according to NX (?)
- add changes to CHANGELOGs
- `git commit -am "chore: package versions bumped"`

Check version of @azure/functions https://github.com/Azure/azure-functions-nodejs-library

If needed:

- change in [generator.spec.ts](packages/azure-func/src/generators/application/generator.spec.ts) & [generator.ts](packages/azure-func/src/generators/application/generator.ts)
- check if any changes to generated functions needed
- add to [migrations.json](packages/azure-func/migrations.json)
- add info to changelog
- `nx affected:test`
- `git commit -am "feat(azure-func): upgrade @azure/functions to ???"`

To publish:

- `git push`
- on github, create and merge a PR
- create new release for each package
