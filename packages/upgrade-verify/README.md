# Nx Upgrade Verify Plugin

This plugin provides functionality to verify the build of a project after NX upgrade by comparing dist file statistics and detecting any significant differences.

On each run, the executor builds the project for each configuration from the build target. At the first run, the executor generates stats in the `.stats` directory of the project from the built files.

At every subsequent run, the executor compares the current saved stats with the new ones, writes out difference percentages to the output, and then updates the stats.

The stats can be committed to the repository for future use.

If the percentage differences cross a threshold of 10%, the executor will report a failure.

## Installation

To install the plugin, run the following command:

```bash
npm install -D @ziacik/upgrade-verify
```

## Usage

Once the plugin is installed, you can use it as a custom executor in your project's configuration. Here's an example configuration:

```json
{
	"name": "my-app",
	...
	"targets": {
		"verify-build": {
			"executor": "@ziacik/upgrade-verify:verify-build",
			"options": {
				"removeHashes": true
			}
		},
		...
	},
	...
}
```

Then to use the plugin, run

```bash
nx verify-build my-app
```

## License

This project is licensed under the MIT License.
