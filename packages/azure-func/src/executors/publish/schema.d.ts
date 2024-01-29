import { SchemaWithBuildTarget } from '../../utils/schemaWithBuildTarget';

export interface PublishExecutorSchema extends SchemaWithBuildTarget {
	azureAppName?: string;
	projectLanguage?: string
}
