# Nx Azure Function Plugin

This plugin provides generators and executors for Azure Functions.
The plugin uses azure functions version 4.

## Installation

To install the plugin, run the following command:

```bash
npm install -D @ziacik/azure-func
```

## Usage

To generate an azure function application:

`nx generate @ziacik/azure-func:application --name=my-func-app --directory=packages/my-func-app --projectNameAndRootFormat=as-provided`

To generate a HTTP trigger function:

`nx generate @ziacik/azure-func:function --name=hello-world --project=my-func-app`

To serve the application locally:

`nx serve my-func-app`

To publish the application to azure:

`nx publish my-func-app`

## Prerequisites

For generating, there are no prerequisites.

For `serve`, a `func` cli has to be installed:

`npm i -g azure-functions-core-tools@4 --unsafe-perm true`

> See https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools for more information about alternative ways to install.

For `publish`, the user must be logged into azure using the `az` cli.

> See https://learn.microsoft.com/en-us/cli/azure/install-azure-cli for instructions to install `az` cli.

Then, run

`az login`

Before publishing, create an **Azure Function App** in Azure. You can do so using the Azure Portal website https://portal.azure.com/#create/Microsoft.FunctionApp or using the `az` cli. The name of the application should be set in the publish target's `azureAppName` option (it can also be set in the application generator).

## License

This project is licensed under the MIT License.
