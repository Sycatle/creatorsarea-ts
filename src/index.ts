/**
 * CreatorsArea TypeScript SDK
 * 
 * A TypeScript/JavaScript client for the CreatorsArea.fr job marketplace API.
 * 
 * @packageDocumentation
 */

export { CreatorsAreaClient } from './client';
export { Category } from './types';
export type { Job, GetJobsOptions, ClientConfig } from './types';
export {
  CreatorsAreaError,
  APIError,
  NetworkError,
  ValidationError,
} from './exceptions';

export const VERSION = '0.1.0';
