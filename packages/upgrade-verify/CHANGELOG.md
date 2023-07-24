# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.4...HEAD
[0.0.4]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.3...upgrade-verify-0.0.4
[0.0.3]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.2...upgrade-verify-0.0.3
[0.0.2]: https://github.com/ziacik/nx-tools/compare/upgrade-verify-0.0.1...upgrade-verify-0.0.2
[0.0.1]: https://github.com/ziacik/nx-tools/releases/tag/upgrade-verify-0.0.1
