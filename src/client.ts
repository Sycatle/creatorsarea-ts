import type { Job, Tag, GetJobsOptions, ClientConfig, JobsResponse, TagsResponse, Pagination } from './types';
import { APIError, NetworkError, ValidationError } from './exceptions';
import { JobQueryBuilder } from './query-builder';

/**
 * Client for interacting with the CreatorsArea.fr API
 * 
 * @example
 * ```typescript
 * const client = new CreatorsAreaClient();
 * const { results, pagination } = await client.getJobs({ volunteer: true });
 * console.log(results);
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
    this.userAgent = config.userAgent ?? 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0';
    this.timeout = config.timeout ?? 10000;
  }

  /**
   * Create a new query builder for constructing complex queries
   * 
   * @returns A new JobQueryBuilder instance
   * 
   * @example
   * ```typescript
   * const { results, pagination } = await client
   *   .query()
   *   .category('DESIGNER')
   *   .volunteer(true)
   *   .status(JobStatus.ACTIVE)
   *   .execute();
   * ```
   */
  query(): JobQueryBuilder {
    return new JobQueryBuilder(this);
  }

  /**
   * Fetch all available tags from CreatorsArea.fr
   * 
   * @returns Array of Tag objects
   * @throws {APIError} If the API request fails
   * @throws {NetworkError} If there's a network error
   * @throws {ValidationError} If response validation fails
   * 
   * @example
   * ```typescript
   * const tags = await client.getTags();
   * console.log(tags);
   * ```
   */
  async getTags(): Promise<Tag[]> {
    try {
      const url = `${this.baseUrl}/tags/offers`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.5',
          'Sec-GPC': '1',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        credentials: 'omit',
        mode: 'cors',
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

      const data = await response.json() as TagsResponse;

      // API returns tags as object with numeric keys
      if (typeof data !== 'object' || data === null) {
        throw new ValidationError('Expected object response from API', data);
      }

      // Convert object to array
      const tags: Tag[] = Object.values(data);

      return tags;

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
   * Fetch jobs from CreatorsArea.fr
   * 
   * @param options - Options for fetching jobs
   * @returns Object containing job results and pagination info
   * @throws {APIError} If the API request fails
   * @throws {NetworkError} If there's a network error
   * @throws {ValidationError} If response validation fails
   * 
   * @example
   * ```typescript
   * // Get volunteer jobs
   * const { results, pagination } = await client.getJobs({ volunteer: true });
   * 
   * // Get jobs on page 2
   * const { results, pagination } = await client.getJobs({ page: 1 });
   * 
   * // Get jobs filtered by tags
   * const { results, pagination } = await client.getJobs({ tags: ['tagId1', 'tagId2'] });
   * 
   * // Get jobs filtered by category
   * const { results, pagination } = await client.getJobs({ category: 'DESIGNER' });
   * 
   * // Get editor jobs
   * const { results, pagination } = await client.getJobs({ category: 'EDITOR' });
   * ```
   */
  async getJobs(options: GetJobsOptions = {}): Promise<{ results: Job[], pagination: Pagination }> {
    const { volunteer, page, tags, kind, status, category } = options;

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (volunteer !== undefined) {
        params.append('volunteer', String(volunteer));
      }
      
      if (page !== undefined) {
        params.append('page', String(page));
      }
      
      if (tags !== undefined) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        tagArray.forEach(tag => params.append('tags', tag));
      }
      
      if (kind !== undefined) {
        params.append('kind', kind);
      }
      
      if (status !== undefined) {
        params.append('status', status);
      }
      
      if (category !== undefined) {
        params.append('category', category);
      }

      const queryString = params.toString();
      const url = `${this.baseUrl}/offers${queryString ? '?' + queryString : ''}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.5',
          'Sec-GPC': '1',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        credentials: 'omit',
        mode: 'cors',
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

      const data = await response.json() as any;

      // API returns { results: {...}, pagination: {...} }
      if (typeof data !== 'object' || data === null || !data.results || !data.pagination) {
        throw new ValidationError('Expected results and pagination in API response', data);
      }

      // Convert results object to array
      const resultsObj = data.results as Record<string, Job>;
      const results: Job[] = Object.values(resultsObj);
      const pagination: Pagination = data.pagination;

      return { results, pagination };

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
   * @param jobId - The job ID (MongoDB ObjectId)
   * @returns Job object or null if not found
   * @throws {APIError} If the API request fails
   * @throws {NetworkError} If there's a network error
   * 
   * @example
   * ```typescript
   * const job = await client.getJobById('691f3358bab478f06fd144d3');
   * if (job) {
   *   console.log(job.title);
   * }
   * ```
   */
  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const url = `${this.baseUrl}/offers/${jobId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.5',
          'Sec-GPC': '1',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        credentials: 'omit',
        mode: 'cors',
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

      const data = await response.json() as Job;
      return data;

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
   * Build the full URL for a job listing
   * 
   * @param job - The job object or slug
   * @returns Full URL to the job listing
   * 
   * @example
   * ```typescript
   * const url = client.getJobUrl(job);
   * // Returns: https://creatorsarea.fr/offres/associatif-responsable-communication-hf
   * ```
   */
  getJobUrl(job: Job | string): string {
    const slug = typeof job === 'string' ? job : job.slug;
    return `https://creatorsarea.fr/offres/${slug}`;
  }
}
