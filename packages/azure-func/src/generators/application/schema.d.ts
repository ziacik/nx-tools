import { Schema } from '@nx/node/src/generators/application/schema';

export interface ApplicationGeneratorSchema extends Schema {
	name: string;
	azureAppName?: string;
}
