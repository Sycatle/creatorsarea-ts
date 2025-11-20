/**
 * Job kind/type on CreatorsArea
 */
export enum JobKind {
  TEAM = 'TEAM',
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  EDITOR = 'EDITOR',
}

/**
 * Job status on CreatorsArea
 */
export enum JobStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  DRAFT = 'DRAFT',
}

/**
 * Tag/Category information
 */
export interface Tag {
  /** Tag unique identifier */
  _id: string;
  /** Tag display name */
  name: string;
  /** Tag image URL */
  image: string;
  /** Whether the tag is active */
  isActive?: boolean;
  /** Creation date */
  createdAt?: string;
  /** Last update date */
  updatedAt?: string;
}

/**
 * Author/User information
 */
export interface Author {
  /** User unique identifier */
  _id: string;
  /** User avatar hash */
  avatar: string;
  /** Discord user ID */
  discord_id: string;
}

/**
 * Pricing information for a job
 */
export interface Pricing {
  /** Price value (0 if volunteer) */
  value: number;
  /** Whether this is volunteer work */
  volunteer: boolean;
  /** Whether the price is negotiable */
  negotiable: boolean;
}

/**
 * Alert information
 */
export interface Alert {
  /** Alert identifier */
  alert: string;
  /** Discord message ID */
  messageid: string;
  /** Alert unique identifier */
  _id: string;
}

/**
 * Represents a job listing from CreatorsArea.fr
 */
export interface Job {
  /** Unique identifier for the job */
  _id: string;
  /** Job title */
  title: string;
  /** URL-friendly slug */
  slug: string;
  /** Job content/description */
  content: string;
  /** Author information */
  author: Author;
  /** Pricing information */
  pricing: Pricing;
  /** Job kind (TEAM or COMMISSION) */
  kind: JobKind;
  /** Job status (ACTIVE, CLOSED, DRAFT) */
  status: JobStatus;
  /** Deadline for applications (if any) */
  deadline: string | null;
  /** Associated tags */
  _tags: Tag[];
  /** Thread IDs */
  threads: string[];
  /** Discord thread ID */
  thread?: string;
  /** Alert information */
  alerts: Alert[];
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Pagination information
 */
export interface Pagination {
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page (0-indexed) */
  page: number;
}

/**
 * API response for job listings
 */
export interface JobsResponse {
  /** Job results as object with numeric keys */
  results: Record<string, Job>;
  /** Pagination information */
  pagination: Pagination;
}

/**
 * API response for tags
 */
export interface TagsResponse {
  /** Tags as object with numeric keys */
  [key: string]: Tag;
}

/**
 * Options for fetching jobs
 */
export interface GetJobsOptions {
  /** Filter by volunteer jobs only */
  volunteer?: boolean;
  /** Page number (0-indexed) */
  page?: number;
  /** Filter by tag ID(s) */
  tags?: string | string[];
  /** Filter by job kind */
  kind?: JobKind;
  /** Filter by job status */
  status?: JobStatus;
  /** Filter by category (DEVELOPER, DESIGNER, EDITOR, TEAM) */
  category?: 'DEVELOPER' | 'DESIGNER' | 'EDITOR' | 'TEAM';
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
