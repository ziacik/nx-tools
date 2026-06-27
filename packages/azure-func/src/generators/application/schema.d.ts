import { Schema } from '@nx/node/internal';

export interface ApplicationGeneratorSchema extends Schema {
	name: string;
	azureAppName?: string;
}
