# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2024-03-23

### Changed

- Upgraded nx to 18.1.0.

## [2.0.0] - 2024-02-18

### Changed

- Upgraded nx to 18.0.4.

## [1.3.0] - 2023-12-25

### Changed

- Upgraded nx to 17.2.7.

## [1.2.0] - 2023-11-19

### Changed

- Upgraded nx to 17.1.2.

## [1.1.1] - 2023-11-05

### Changed

- Upgraded nx to 17.0.3.

## [1.1.0] - 2023-10-22

### Changed

- Upgraded nx to 17.0.1.

## [1.0.1] - 2023-10-21

### Fixed

- Fixed the "Package subpath './package.json' is not defined by "exports"" error. #20
- Generated stats are now properly sorted when remove hashes option is used. #19

## [1.0.0] - 2023-10-21

### Added

- `removeHashes` option added to the `verify-build` executor, with a default of `true`, which removes hashes from file names, making the comparisons more deterministic.
- `check-issues` executor added.

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

[unreleased]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-2.1.0...HEAD
[2.1.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-2.0.0...upgrade-verify-2.1.0
[2.0.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-1.3.0...upgrade-verify-2.0.0
[1.3.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-1.2.0...upgrade-verify-1.3.0
[1.2.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-1.1.1...upgrade-verify-1.2.0
[1.1.1]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-1.1.0...upgrade-verify-1.1.1
[1.1.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-1.0.1...upgrade-verify-1.1.0
[1.0.1]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-1.0.0...upgrade-verify-1.0.1
[1.0.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.2.0...upgrade-verify-1.0.0
[0.2.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.1.1...upgrade-verify-0.2.0
[0.1.1]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.1.0...upgrade-verify-0.1.1
[0.1.0]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.4...upgrade-verify-0.1.0
[0.0.4]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.3...upgrade-verify-0.0.4
[0.0.3]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.2...upgrade-verify-0.0.3
[0.0.2]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.1...upgrade-verify-0.0.2
[0.0.1]: https://github.com/ziacik/nx-tools/releases/tag/upgrade-verify-0.0.1
