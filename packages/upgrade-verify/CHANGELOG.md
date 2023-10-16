# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2023-10-16

## Added

- `removeHashes` option added to the `verify-build` executor, with a default of `true`, which removes hashes from file names, making the comparisons more deterministic.

## [0.2.0] - 2023-10-15

### Changed

- Upgraded nx to 16.10.0.

## [0.1.1] - 2023-09-26

### Changed

- Upgraded nx to 16.9.1.

## [0.1.0] - 2023-09-23

### Changed

- Upgraded nx to 16.9.0.

## [0.0.4] - 2023-07-24

### Fixed

- Package exports error fixed.

## [0.0.3] - 2023-07-23

### Fixed

- Build runs are now isolated from ExecutorContext and process.env changes so that they do not interfere with each other.

## [0.0.2] - 2023-07-07

### Changed

- READMEs updated and props added to package.json.
- A _Package subpath './package.json' is not defined by "exports"_ error hopefully fixed.

[unreleased]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-1.0.0...HEAD
[1.0.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.2.0...upgrade-verify-1.0.0
[0.2.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.1.1...upgrade-verify-0.2.0
[0.1.1]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.1.0...upgrade-verify-0.1.1
[0.1.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.4...upgrade-verify-0.1.0
[0.0.4]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.3...upgrade-verify-0.0.4
[0.0.3]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.2...upgrade-verify-0.0.3
[0.0.2]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.1...upgrade-verify-0.0.2
[0.0.1]: https://github.com/ziacik/nx-tools/releases/tag/upgrade-verify-0.0.1
