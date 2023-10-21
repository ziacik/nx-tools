# Nx Upgrade Verify Plugin

This plugin provides functionality to verify various aspects of a workspace after NX upgrade.

## Installation

To install the plugin, run the following command:

```bash
npm install -D @ziacik/upgrade-verify
```

## Usage

Once the plugin is installed, you can use its executors in your project's configuration.

### verify-build executor

This executor provides functionality to verify the build of a project after NX upgrade by comparing dist file statistics and detecting any significant differences.

On each run, the executor builds the project for each configuration from the build target. At the first run, the executor generates stats in the `.stats` directory of the project from the built files.

At every subsequent run, the executor compares the current saved stats with the new ones, writes out difference percentages to the output, and then updates the stats.

The stats can be committed to the repository for future use.

If the percentage differences cross a threshold of 10%, the executor will report a failure.

#### Example configuration

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

Then to use the executor, run

```bash
nx verify-build my-app
```

### check-issues executor

This executor serves as a watchdog for external issues tracked on github that are listed in workspace root's **ISSUES.md** file. This is useful when for example when a workaround has been introduced becaues of a bug, and we would like to remove that workaround when the issue is resolved.

When this executor is run, it takes all issues listed in the **ISSUES.md** file, check if they are still active and lists all that have already been closed. That allows us to take action and remove that issue from the list.

#### Example contents of `ISSUES.md`

```markdown
# Issues to be watched

https://github.com/ziacik/nx-tools/issues/1
[https://github.com/ziacik/nx-tools/issues/2](https://github.com/ziacik/nx-tools/issues/2)
[Some issue](https://github.com/ziacik/nx-tools/issues/3)
```

#### Example configuration

```json
{
	"name": "my-app",
	...
	"targets": {
		"check-issues": {
			"executor": "@ziacik/upgrade-verify:check-issues"
		},
		...
	},
	...
}
```

Then to use the executor, run

```bash
nx check-issues my-app
```

## License

This project is licensed under the MIT License.
