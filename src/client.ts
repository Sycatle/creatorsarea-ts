import type { Job, Category, GetJobsOptions, ClientConfig } from './types';
import { APIError, NetworkError, ValidationError } from './exceptions';

/**
 * Client for interacting with the CreatorsArea.fr API
 * 
 * @example
 * ```typescript
 * const client = new CreatorsAreaClient();
 * const jobs = await client.getJobs({ category: Category.DEVELOPER, limit: 10 });
 * console.log(jobs);
 * ```
 */
export class CreatorsAreaClient {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly timeout: number;

  /**
   * Create a new CreatorsArea client
   * 
   * @param config - Optional configuration
   */
  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'https://creatorsarea.fr/api';
    this.userAgent = config.userAgent ?? 'creatorsarea-ts/0.1.0';
    this.timeout = config.timeout ?? 10000;
  }

  /**
   * Fetch jobs from CreatorsArea.fr
   * 
   * @param options - Options for fetching jobs
   * @returns Array of Job objects
   * @throws {APIError} If the API request fails
   * @throws {NetworkError} If there's a network error
   * @throws {ValidationError} If response validation fails
   * 
   * @example
   * ```typescript
   * // Get all developer jobs
   * const jobs = await client.getJobs({ category: Category.DEVELOPER });
   * 
   * // Get up to 5 jobs
   * const jobs = await client.getJobs({ limit: 5 });
   * ```
   */
  async getJobs(options: GetJobsOptions = {}): Promise<Job[]> {
    const { category, limit } = options;
    const categoryParam = category ?? 'DEVELOPER';

    try {
      const url = `${this.baseUrl}/offers?category=${categoryParam}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `API request failed with status ${response.status}`,
          response.status,
          await response.text()
        );
      }

      const data: any = await response.json();

      // API returns { results: Job[], pagination: {...} }
      const results = data.results ?? data;
      
      if (!Array.isArray(results)) {
        throw new ValidationError('Expected array response from API', data);
      }

      const jobs = results.map((item: any) => this.parseJob(item));

      return limit ? jobs.slice(0, limit) : jobs;

    } catch (error) {
      if (error instanceof APIError || error instanceof ValidationError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.timeout}ms`);
      }

      throw new NetworkError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get a single job by ID
   * 
   * @param jobId - The job ID
   * @returns Job object or null if not found
   * @throws {APIError} If the API request fails
   * @throws {NetworkError} If there's a network error
   * 
   * @example
   * ```typescript
   * const job = await client.getJobById('creatorsarea_abc123');
   * if (job) {
   *   console.log(job.title);
   * }
   * ```
   */
  async getJobById(jobId: string): Promise<Job | null> {
    // Remove source prefix if present
    const rawId = jobId.replace('creatorsarea_', '');

    try {
      const url = `${this.baseUrl}/offers/${rawId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new APIError(
          `API request failed with status ${response.status}`,
          response.status,
          await response.text()
        );
      }

      const data = await response.json();
      return this.parseJob(data);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.timeout}ms`);
      }

      throw new NetworkError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Parse raw API response into a Job object
   */
  private parseJob(data: any): Job {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid job data', data);
    }

    const id = `creatorsarea_${data._id || data.id || ''}`;
    const title = String(data.title || data.name || 'Untitled');
    const url = data.url || `https://creatorsarea.fr/offres/${data._id || data.id}`;

    return {
      id,
      title,
      url,
      source: 'creatorsarea',
      description: data.description || data.content || null,
      budget: data.budget || data.price || null,
      category: data.category || null,
      applications: data.applications || data.applicants || null,
      createdAt: data.createdAt ? new Date(data.createdAt) : null,
    };
  }
}
