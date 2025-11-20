import type { GetJobsOptions, Job, Pagination, JobKind, JobStatus } from './types';
import type { CreatorsAreaClient } from './client';

/**
 * Query builder for constructing complex job queries with a fluent API
 * 
 * @example
 * ```typescript
 * const { results, pagination } = await client
 *   .query()
 *   .category('DESIGNER')
 *   .volunteer(true)
 *   .tags(['tagId1', 'tagId2'])
 *   .status(JobStatus.ACTIVE)
 *   .page(0)
 *   .execute();
 * ```
 */
export class JobQueryBuilder {
  private options: GetJobsOptions = {};

  constructor(private client: CreatorsAreaClient) {}

  /**
   * Filter by volunteer jobs only
   * 
   * @param isVolunteer - Whether to filter volunteer jobs
   * @returns The query builder for chaining
   * 
   * @example
   * ```typescript
   * query.volunteer(true)
   * ```
   */
  volunteer(isVolunteer: boolean): this {
    this.options.volunteer = isVolunteer;
    return this;
  }

  /**
   * Set the page number (0-indexed)
   * 
   * @param pageNumber - Page number to fetch
   * @returns The query builder for chaining
   * 
   * @example
   * ```typescript
   * query.page(2) // Get page 3 (0-indexed)
   * ```
   */
  page(pageNumber: number): this {
    if (pageNumber < 0) {
      throw new Error('Page number must be >= 0');
    }
    this.options.page = pageNumber;
    return this;
  }

  /**
   * Filter by one or more tag IDs
   * 
   * @param tagIds - Single tag ID or array of tag IDs
   * @returns The query builder for chaining
   * 
   * @example
   * ```typescript
   * query.tags('tagId1')
   * query.tags(['tagId1', 'tagId2'])
   * ```
   */
  tags(tagIds: string | string[]): this {
    this.options.tags = tagIds;
    return this;
  }

  /**
   * Add a single tag to the filter
   * 
   * @param tagId - Tag ID to add
   * @returns The query builder for chaining
   * 
   * @example
   * ```typescript
   * query.addTag('tagId1').addTag('tagId2')
   * ```
   */
  addTag(tagId: string): this {
    if (!this.options.tags) {
      this.options.tags = [tagId];
    } else if (typeof this.options.tags === 'string') {
      this.options.tags = [this.options.tags, tagId];
    } else {
      this.options.tags.push(tagId);
    }
    return this;
  }

  /**
   * Filter by job kind
   * 
   * @param jobKind - Job kind to filter by
   * @returns The query builder for chaining
   * 
   * @example
   * ```typescript
   * query.kind(JobKind.TEAM)
   * ```
   */
  kind(jobKind: JobKind): this {
    this.options.kind = jobKind;
    return this;
  }

  /**
   * Filter by job status
   * 
   * @param jobStatus - Job status to filter by
   * @returns The query builder for chaining
   * 
   * @example
   * ```typescript
   * query.status(JobStatus.ACTIVE)
   * ```
   */
  status(jobStatus: JobStatus): this {
    this.options.status = jobStatus;
    return this;
  }

  /**
   * Filter by category
   * 
   * @param categoryName - Category name (DEVELOPER, DESIGNER, EDITOR, TEAM)
   * @returns The query builder for chaining
   * 
   * @example
   * ```typescript
   * query.category('DESIGNER')
   * ```
   */
  category(categoryName: 'DEVELOPER' | 'DESIGNER' | 'EDITOR' | 'TEAM'): this {
    this.options.category = categoryName;
    return this;
  }

  /**
   * Reset all filters
   * 
   * @returns The query builder for chaining
   * 
   * @example
   * ```typescript
   * query.reset().category('DESIGNER')
   * ```
   */
  reset(): this {
    this.options = {};
    return this;
  }

  /**
   * Get the current query options without executing
   * 
   * @returns The current query options
   * 
   * @example
   * ```typescript
   * const options = query.category('DESIGNER').build();
   * console.log(options); // { category: 'DESIGNER' }
   * ```
   */
  build(): GetJobsOptions {
    return { ...this.options };
  }

  /**
   * Execute the query and return the results
   * 
   * @returns Promise with job results and pagination
   * 
   * @example
   * ```typescript
   * const { results, pagination } = await query
   *   .category('DESIGNER')
   *   .volunteer(true)
   *   .execute();
   * ```
   */
  async execute(): Promise<{ results: Job[]; pagination: Pagination }> {
    return this.client.getJobs(this.options);
  }

  /**
   * Execute the query and return only the results (without pagination info)
   * 
   * @returns Promise with job results array
   * 
   * @example
   * ```typescript
   * const jobs = await query.category('DESIGNER').executeAndGetResults();
   * ```
   */
  async executeAndGetResults(): Promise<Job[]> {
    const { results } = await this.execute();
    return results;
  }

  /**
   * Execute the query and get all pages automatically
   * Note: This method may trigger rate limiting for large datasets.
   * Consider using stream() for better performance.
   * 
   * @param delayMs - Delay between requests in milliseconds (default: 500ms)
   * @returns Promise with all job results from all pages
   * 
   * @example
   * ```typescript
   * const allJobs = await query.category('DESIGNER').executeAll();
   * console.log(`Found ${allJobs.length} total jobs`);
   * ```
   */
  async executeAll(delayMs: number = 500): Promise<Job[]> {
    const allJobs: Job[] = [];
    let currentPage = 0;
    let hasMore = true;

    while (hasMore) {
      const { results, pagination } = await this.client.getJobs({
        ...this.options,
        page: currentPage,
      });

      allJobs.push(...results);
      hasMore = currentPage < pagination.totalPages - 1;
      
      if (hasMore && delayMs > 0) {
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      currentPage++;
    }

    return allJobs;
  }

  /**
   * Execute the query and get a stream of results
   * Useful for processing large amounts of jobs without loading all into memory
   * Note: Includes automatic delay to avoid rate limiting
   * 
   * @param delayMs - Delay between page requests in milliseconds (default: 500ms)
   * @returns AsyncGenerator that yields jobs one by one
   * 
   * @example
   * ```typescript
   * for await (const job of query.category('DESIGNER').stream()) {
   *   console.log(job.title);
   * }
   * ```
   */
  async *stream(delayMs: number = 500): AsyncGenerator<Job> {
    let currentPage = 0;
    let hasMore = true;

    while (hasMore) {
      const { results, pagination } = await this.client.getJobs({
        ...this.options,
        page: currentPage,
      });

      for (const job of results) {
        yield job;
      }

      hasMore = currentPage < pagination.totalPages - 1;
      
      if (hasMore && delayMs > 0) {
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      currentPage++;
    }
  }

  /**
   * Count total jobs matching the query without fetching all data
   * 
   * @returns Promise with the total count
   * 
   * @example
   * ```typescript
   * const count = await query.category('DESIGNER').count();
   * console.log(`${count} designer jobs available`);
   * ```
   */
  async count(): Promise<number> {
    const { pagination } = await this.client.getJobs({ ...this.options, page: 0 });
    return pagination.totalItems;
  }
}
