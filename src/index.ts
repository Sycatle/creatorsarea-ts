/**
 * CreatorsArea TypeScript SDK (Unofficial)
 * 
 * An unofficial TypeScript/JavaScript client for the CreatorsArea.fr job marketplace API.
 * This SDK is not affiliated with, endorsed by, or officially connected to CreatorsArea.fr.
 * 
 * @packageDocumentation
 */

export { CreatorsAreaClient } from './client';
export { JobQueryBuilder } from './query-builder';
export { JobKind, JobStatus } from './types';
export type { 
  Job, 
  Tag, 
  Author, 
  Pricing, 
  Alert, 
  Pagination,
  JobsResponse,
  TagsResponse,
  GetJobsOptions, 
  ClientConfig 
} from './types';
export {
  CreatorsAreaError,
  APIError,
  NetworkError,
  ValidationError,
} from './exceptions';

export const VERSION = '0.2.0';
