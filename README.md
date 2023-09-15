# NX Tools Plugin Monorepository

This repository serves as a monorepository for some NX plugins.

## Overview

This repository is a collection of plugins that provide various capabilities to nx monorepos.

The monorepository currently includes the following plugins:

- [@ziacik/upgrade-verify](packages/upgrade-verify): A plugin focused on verifying the upgrade of nx workspace to a new version. It provides executors to help verifying that after the upgrade the generated builds are generating similar files as before the upgrade.

- [@ziacik/azure-func](packages/azure-func): A plugin focused on generating, serving and publishing Azure Function applications.

Please refer to the documentation of each plugin for more detailed information on their specific features.

## License

This repository is licensed under the MIT License.
