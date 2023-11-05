# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.1] - 2023-11-05

### Changed

- Upgraded nx to 17.0.3.

## [1.3.0] - 2023-10-22

### Changed

- Upgraded nx to 17.0.1.

## [1.2.0] - 2023-10-15

### Changed

- Upgraded nx to 16.10.0.

## [1.1.3] - 2023-09-30

### Fixed

- Fixed migration for @azure/function upgrade.

## [1.1.2] - 2023-09-30

### Changed

- Upgraded @azure/functions to 4.0.1.

## [1.1.1] - 2023-09-26

### Changed

- Upgraded nx to 16.9.1.

## [1.1.0] - 2023-09-23

### Changed

- Upgraded nx to 16.9.0.

## [1.0.1] - 2023-09-22

### Fixed

- Application generator now supports generating custom `azureAppName`.
- Application generator now generates _publish_ target with _production_ as default configuration instead of _development_.

### Changed

- The `azureAppName` option is now optional in _publish_ target, with fallback calculated at runtime.
- Better logging in case when `func` cli is not installed.
- Bumped `@azure/functions` dep to _alpha.13_.
- Better _README_.

## [1.0.0] - 2023-09-20

### Added

- Function generator added.

### Changed

- Application generator now includes a sample spec file.

## [0.3.1] - 2023-09-17

### Fixed

- Unpublished `util` dependency removed.

## [0.3.0] - 2023-09-16

### Added

- `publish` executor added.

## [0.2.0] - 2023-09-15

### Changed

- `serve` now watches the project for changes.

[unreleased]: https://github.com/ziacik/nx-tools/compare/azure-func-1.3.1...HEAD
[1.3.1]: https://github.com/ziacik/nx-tools/compare/azure-func-1.3.0...azure-func-1.3.1
[1.3.0]: https://github.com/ziacik/nx-tools/compare/azure-func-1.2.0...azure-func-1.3.0
[1.2.0]: https://github.com/ziacik/nx-tools/compare/azure-func-1.1.3...azure-func-1.2.0
[1.1.3]: https://github.com/ziacik/nx-tools/compare/azure-func-1.1.2...azure-func-1.1.3
[1.1.2]: https://github.com/ziacik/nx-tools/compare/azure-func-1.1.1...azure-func-1.1.2
[1.1.1]: https://github.com/ziacik/nx-tools/compare/azure-func-1.1.0...azure-func-1.1.1
[1.1.0]: https://github.com/ziacik/nx-tools/compare/azure-func-1.0.0...azure-func-1.1.0
[1.0.0]: https://github.com/ziacik/nx-tools/compare/azure-func-0.3.1...azure-func-1.0.0
[0.3.1]: https://github.com/ziacik/nx-tools/compare/azure-func-0.3.0...azure-func-0.3.1
[0.3.0]: https://github.com/ziacik/nx-tools/compare/azure-func-0.2.0...azure-func-0.3.0
[0.2.0]: https://github.com/ziacik/nx-tools/releases/tag/azure-func-0.2.0
