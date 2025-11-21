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
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly requestDelay: number;
  private readonly debug: boolean;
  private lastRequestTime: number = 0;

  /**
   * Create a new CreatorsArea client
   * 
   * @param config - Optional configuration
   */
  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'https://creatorsarea.fr/api';
    this.userAgent = config.userAgent ?? 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0';
    this.timeout = config.timeout ?? 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.requestDelay = config.requestDelay ?? 100;
    this.debug = config.debug ?? false;
  }

  /**
   * Log debug message if debug mode is enabled
   */
  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[CreatorsAreaClient] ${message}`, ...args);
    }
  }

  /**
   * Wait for minimum delay between requests to avoid rate limiting
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      const delay = this.requestDelay - timeSinceLastRequest;
      this.log(`Rate limiting: waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch with automatic retry on rate limit (429) and server errors (5xx)
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 0
  ): Promise<Response> {
    await this.waitForRateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      this.log(`Fetching (attempt ${attempt + 1}/${this.maxRetries + 1}): ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting with retry
      if (response.status === 429) {
        if (attempt < this.maxRetries) {
          // Extract Retry-After header if available
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          
          this.log(`Rate limited (429). Retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchWithRetry(url, options, attempt + 1);
        }
        
        throw new APIError(
          `Rate limit exceeded (429) after ${this.maxRetries} retries`,
          429,
          await response.text()
        );
      }

      // Handle server errors with retry
      if (response.status >= 500 && response.status < 600) {
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          this.log(`Server error (${response.status}). Retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchWithRetry(url, options, attempt + 1);
        }
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.timeout}ms`);
      }
      
      // Retry on network errors
      if (attempt < this.maxRetries && !(error instanceof APIError)) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        this.log(`Network error. Retrying after ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      
      throw error;
    }
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

      const response = await this.fetchWithRetry(url, {
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
      });

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
      if (error instanceof APIError || error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
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

    // Validate page number
    if (page !== undefined && page < 0) {
      throw new ValidationError(
        `Page number must be >= 0, got: ${page}`,
        { page }
      );
    }

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
        // Try comma-separated format first (more compatible)
        if (tagArray.length > 0) {
          params.append('tags', tagArray.join(','));
        }
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
      
      const response = await this.fetchWithRetry(url, {
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
      });

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

      // Debug: log results structure if debug mode is enabled
      this.log(`Results type: ${Array.isArray(data.results) ? 'array' : 'object'}, length: ${Array.isArray(data.results) ? data.results.length : Object.keys(data.results).length}`);

      // Convert results to array (handle both object and array formats)
      let results: Job[];
      if (Array.isArray(data.results)) {
        // API returned results as array directly
        results = data.results as Job[];
      } else {
        // API returned results as object with numeric keys
        const resultsObj = data.results as Record<string, Job>;
        results = Object.values(resultsObj);
      }
      
      const pagination: Pagination = data.pagination;

      return { results, pagination };

    } catch (error) {
      if (error instanceof APIError || error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
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
   * @throws {ValidationError} If the job ID format is invalid
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
    // Validate MongoDB ObjectId format (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(jobId)) {
      throw new ValidationError(
        `Invalid MongoDB ObjectId format: ${jobId}. Expected 24 hexadecimal characters.`,
        jobId
      );
    }

    try {
      const url = `${this.baseUrl}/offers/${jobId}`;
      
      const response = await this.fetchWithRetry(url, {
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
      });

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
      if (error instanceof APIError || error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
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
