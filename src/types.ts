/**
 * Job categories available on CreatorsArea.fr
 */
export enum Category {
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  MARKETING = 'MARKETING',
  WRITER = 'WRITER',
  OTHER = 'OTHER',
}

/**
 * Represents a job listing from CreatorsArea.fr
 */
export interface Job {
  /** Unique identifier for the job */
  id: string;
  /** Job title */
  title: string;
  /** Full URL to the job listing */
  url: string;
  /** Source identifier (always 'creatorsarea') */
  source: string;
  /** Job description (may be null if not available) */
  description?: string | null;
  /** Budget information (may be null) */
  budget?: string | null;
  /** Job category */
  category?: string | null;
  /** Number of applications (may be null) */
  applications?: string | null;
  /** Job creation date */
  createdAt?: Date | null;
}

/**
 * Options for fetching jobs
 */
export interface GetJobsOptions {
  /** Category to filter jobs by */
  category?: Category;
  /** Maximum number of jobs to fetch */
  limit?: number;
}

/**
 * Configuration options for the CreatorsArea client
 */
export interface ClientConfig {
  /** Base URL for the API (default: https://creatorsarea.fr/api) */
  baseUrl?: string;
  /** Custom User-Agent header */
  userAgent?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
}
