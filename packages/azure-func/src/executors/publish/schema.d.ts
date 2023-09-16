import { SchemaWithBuildTarget } from '@ziacik/util';

export interface PublishExecutorSchema extends SchemaWithBuildTarget {
	azureAppName: string;
}
