# creatorsarea-ts

> **Unofficial** TypeScript/JavaScript SDK for the [CreatorsArea.fr](https://creatorsarea.fr) job marketplace API

[![npm version](https://img.shields.io/npm/v/creatorsarea-ts.svg)](https://www.npmjs.com/package/creatorsarea-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> ⚠️ **Note**: This is an unofficial SDK. It is not affiliated with, endorsed by, or officially connected to CreatorsArea.fr.

## ⚠️ Important - API Limitations

The CreatorsArea API has **strict rate limiting**. This SDK includes automatic protection:

- ✅ **Automatic retry** on rate limit (429) with exponential backoff
- ✅ **Configurable delays** between requests (recommended: 1000ms)
- ✅ **Smart error handling** with detailed error messages

**Known API issues** (cannot be fixed in SDK):
- ⚠️ `volunteer` filter may not work correctly
- ⚠️ `kind` filter may not work correctly  
- ℹ️ Use `category` filter instead (works reliably)

## Features

✅ **Full TypeScript support** with complete type definitions  
✅ **Fluent Query Builder API** for complex queries  
✅ **Automatic rate limiting protection** with exponential backoff  
✅ **Smart retry mechanism** for failed requests (429, 5xx errors)  
✅ **Input validation** (ObjectId format, page numbers)  
✅ **Modern async/await API**  
✅ **Tree-shakeable** ESM and CJS builds  
✅ **Zero dependencies** (uses native fetch)  
✅ **Lightweight** (~20KB minified)  
✅ **Browser and Node.js** compatible (Node 18+)  
✅ **Memory-efficient streaming** for large datasets  
✅ **Debug mode** for troubleshooting  
✅ **Configurable delays and timeouts**

## Installation

```bash
# pnpm (recommended)
pnpm add creatorsarea-ts

# npm
npm install creatorsarea-ts

# yarn
yarn add creatorsarea-ts

# bun
bun add creatorsarea-ts
```

## Quick Start

```typescript
import { CreatorsAreaClient, JobStatus } from 'creatorsarea-ts';

// Recommended configuration to avoid rate limiting
const client = new CreatorsAreaClient({
  requestDelay: 1000,  // 1 second between requests
  maxRetries: 3,       // Retry up to 3 times on errors
  retryDelay: 2000,    // 2 seconds initial retry delay
});

// Method 1: Direct API call
const { results, pagination } = await client.getJobs({
  category: 'DESIGNER',
  page: 0,
});

// Method 2: Query Builder (recommended for complex queries)
const jobs = await client
  .query()
  .category('DESIGNER')
  .status(JobStatus.ACTIVE)
  .execute();

console.log(`Found ${jobs.results.length} jobs`);
console.log(`Page ${jobs.pagination.page + 1} of ${jobs.pagination.totalPages}`);
```

## Usage

### Basic Example

```typescript
import { CreatorsAreaClient, JobKind } from 'creatorsarea-ts';

const client = new CreatorsAreaClient();

// Fetch designer jobs
const { results: jobs, pagination } = await client.getJobs({
  category: 'DESIGNER',
  kind: JobKind.DESIGNER,
});

jobs.forEach(job => {
  console.log(`${job.title} - ${job.pricing.volunteer ? 'Volunteer' : `${job.pricing.value}€`}`);
  console.log(`URL: ${client.getJobUrl(job)}`);
});

console.log(`Total jobs: ${pagination.totalItems}`);
```

### Get All Available Tags

```typescript
import { CreatorsAreaClient } from 'creatorsarea-ts';

const client = new CreatorsAreaClient();

// Get all tags
const tags = await client.getTags();

tags.forEach(tag => {
  console.log(`${tag.name} - ${tag.image}`);
});
```

### Filter by Tags

```typescript
import { CreatorsAreaClient } from 'creatorsarea-ts';

const client = new CreatorsAreaClient();

// Get all tags first
const tags = await client.getTags();

// Find specific tag
const minecraftTag = tags.find(t => t.name.includes('Minecraft'));

if (minecraftTag) {
  // Get jobs with this tag
  const { results } = await client.getJobs({
    tags: [minecraftTag._id],
  });
  
  console.log(`Found ${results.length} Minecraft jobs`);
}
```

### Pagination

```typescript
import { CreatorsAreaClient } from 'creatorsarea-ts';

const client = new CreatorsAreaClient();

// Get first page (page is 0-indexed)
const page1 = await client.getJobs({ page: 0 });
console.log(`Page 1: ${page1.results.length} jobs`);

// Get second page
const page2 = await client.getJobs({ page: 1 });
console.log(`Page 2: ${page2.results.length} jobs`);

// Get all pages
async function getAllJobs() {
  const allJobs = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { results, pagination } = await client.getJobs({ page });
    allJobs.push(...results);
    hasMore = page < pagination.totalPages - 1;
    page++;
  }

  return allJobs;
}
```

### Advanced Example

```typescript
import { CreatorsAreaClient, JobKind, JobStatus, type Job } from 'creatorsarea-ts';

// Custom configuration
const client = new CreatorsAreaClient({
  timeout: 15000, // 15 seconds
  userAgent: 'MyApp/1.0',
});

try {
  // Get active team jobs
  const { results, pagination } = await client.getJobs({
    kind: JobKind.TEAM,
    status: JobStatus.ACTIVE,
  });

  // Filter paid jobs
  const paidJobs = results.filter((job: Job) => !job.pricing.volunteer);

  // Get specific job by ID
  const job = await client.getJobById('691f3358bab478f06fd144d3');
  
  if (job) {
    console.log(`Title: ${job.title}`);
    console.log(`Content: ${job.content}`);
    console.log(`Tags: ${job._tags.map(t => t.name).join(', ')}`);
    console.log(`Author Discord: ${job.author.discord_id}`);
  }

} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', error.statusCode);
  }
}
```

### React Hook Example

```typescript
import { useQuery } from '@tanstack/react-query';
import { CreatorsAreaClient, type GetJobsOptions } from 'creatorsarea-ts';

const client = new CreatorsAreaClient();

function useJobs(options?: GetJobsOptions) {
  return useQuery({
    queryKey: ['creatorsarea-jobs', options],
    queryFn: () => client.getJobs(options),
  });
}

// In your component
function JobsList() {
  const { data, isLoading } = useJobs({ volunteer: true });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Page {data.pagination.page + 1} of {data.pagination.totalPages}</p>
      <ul>
        {data.results.map(job => (
          <li key={job._id}>
            <a href={client.getJobUrl(job)}>{job.title}</a>
            <span>{job._tags.map(t => t.name).join(', ')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Query Builder API

The query builder provides a fluent interface for constructing complex queries:

### Basic Usage

```typescript
const { results, pagination } = await client
  .query()
  .category('DESIGNER')
  .volunteer(false)
  .status(JobStatus.ACTIVE)
  .page(0)
  .execute();
```

### Available Methods

#### Filtering Methods

```typescript
// Filter by category
.category('DEVELOPER' | 'DESIGNER' | 'EDITOR' | 'TEAM')

// Filter by volunteer status
.volunteer(true | false)

// Filter by job status
.status(JobStatus.ACTIVE | JobStatus.CLOSED | JobStatus.DRAFT)

// Filter by job kind
.kind(JobKind.TEAM | JobKind.DEVELOPER | JobKind.DESIGNER | JobKind.EDITOR)

// Filter by tags
.tags(['tagId1', 'tagId2'])
.addTag('tagId')  // Add single tag

// Set page number
.page(0)  // 0-indexed
```

#### Execution Methods

```typescript
// Execute and get results + pagination
const { results, pagination } = await query.execute();

// Execute and get only results array
const jobs = await query.executeAndGetResults();

// Count total matching jobs without fetching all
const count = await query.count();

// Get all jobs from all pages with rate limit protection
const allJobs = await query.executeAll(delayMs?, maxPages?);
// Example: Get first 5 pages with 1s delay
const limitedJobs = await query.executeAll(1000, 5);

// Stream jobs for memory-efficient processing
for await (const job of query.stream(delayMs?, maxPages?)) {
  console.log(job.title);
}
// Example: Stream first 3 pages
for await (const job of query.stream(1000, 3)) {
  processJob(job);
}
```

#### Utility Methods

```typescript
// Build options without executing
const options = query.build();

// Reset all filters
query.reset();
```

### Query Builder Examples

```typescript
import { CreatorsAreaClient, JobStatus } from 'creatorsarea-ts';

const client = new CreatorsAreaClient();

// Example 1: Count jobs without fetching
const designerCount = await client
  .query()
  .category('DESIGNER')
  .volunteer(false)
  .count();

console.log(`${designerCount} paid designer jobs available`);

// Example 2: Get all jobs from all pages
const allDesignerJobs = await client
  .query()
  .category('DESIGNER')
  .executeAll(1000); // 1 second delay between requests

console.log(`Retrieved ${allDesignerJobs.length} total jobs`);

// Example 3: Stream jobs efficiently
for await (const job of client.query().volunteer(true).stream()) {
  console.log(`${job.title} - ${job.pricing.value}€`);
  // Process each job as it comes
}

// Example 4: Dynamic tag filtering
const tags = await client.getTags();
const webTag = tags.find(t => t.name.includes('Site web'));

const jobs = await client
  .query()
  .category('DEVELOPER')
  .addTag(webTag._id)
  .executeAndGetResults();

// Example 5: Reuse and reset
const builder = client.query().category('DESIGNER');

const paidCount = await builder.volunteer(false).count();
builder.reset();
const volunteerCount = await builder.category('DESIGNER').volunteer(true).count();
```

## API Reference

### `CreatorsAreaClient`

#### Constructor

```typescript
new CreatorsAreaClient(config?: ClientConfig)
```

**Options:**
- `baseUrl?: string` - API base URL (default: `https://creatorsarea.fr/api`)
- `userAgent?: string` - Custom User-Agent header
- `timeout?: number` - Request timeout in ms (default: `10000`)
- `maxRetries?: number` - Maximum retry attempts (default: `3`)
- `retryDelay?: number` - Initial retry delay in ms (default: `1000`)
- `requestDelay?: number` - Minimum delay between requests in ms (default: `100`)
- `debug?: boolean` - Enable debug logging (default: `false`)

**Recommended production configuration:**
```typescript
const client = new CreatorsAreaClient({
  requestDelay: 1000,  // Wait 1s between requests to avoid rate limiting
  maxRetries: 3,       // Retry failed requests up to 3 times
  retryDelay: 2000,    // Wait 2s before first retry (doubles on each retry)
  timeout: 15000,      // 15s timeout for requests
  debug: false,        // Disable debug logs in production
});
```

#### Methods

##### `getTags(): Promise<Tag[]>`

Fetch all available tags/categories.

**Returns:** `Promise<Tag[]>`

**Throws:**
- `APIError` - API request failed
- `NetworkError` - Network error
- `ValidationError` - Invalid response

**Example:**
```typescript
const tags = await client.getTags();
```

##### `getJobs(options?): Promise<{ results: Job[], pagination: Pagination }>`

Fetch jobs from CreatorsArea with pagination.

**Parameters:**
- `options.volunteer?: boolean` - Filter by volunteer jobs (⚠️ may not work correctly)
- `options.page?: number` - Page number, 0-indexed (validates >= 0)
- `options.tags?: string | string[]` - Filter by tag ID(s)
- `options.kind?: JobKind` - Filter by job kind (⚠️ may not work correctly)
- `options.status?: JobStatus` - Filter by job status (ACTIVE, CLOSED, DRAFT) ✅
- `options.category?: 'DEVELOPER' | 'DESIGNER' | 'EDITOR' | 'TEAM'` - Filter by category ✅

**Returns:** `Promise<{ results: Job[], pagination: Pagination }>`

**Throws:**
- `ValidationError` - Invalid page number (< 0)
- `APIError` - API request failed (including 429 after retries)
- `NetworkError` - Network error or timeout

**Note:** The SDK automatically retries on 429 and 5xx errors.

**Example:**
```typescript
const { results, pagination } = await client.getJobs({
  category: 'DESIGNER',
  volunteer: false,
  page: 0,
});
```

##### `getJobById(jobId): Promise<Job | null>`

Get a single job by ID.

**Parameters:**
- `jobId: string` - Job ID (must be valid MongoDB ObjectId: 24 hex characters)

**Returns:** `Promise<Job | null>` - Returns `null` if job not found (404)

**Throws:**
- `ValidationError` - Invalid ObjectId format
- `APIError` - API request failed
- `NetworkError` - Network error

**Example:**
```typescript
try {
  const job = await client.getJobById('691f3358bab478f06fd144d3');
  if (job) {
    console.log(job.title);
  } else {
    console.log('Job not found');
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid job ID format');
  }
}
```

##### `getJobUrl(job): string`

Build the full URL for a job listing.

**Parameters:**
- `job: Job | string` - Job object or slug

**Returns:** `string`

**Example:**
```typescript
const url = client.getJobUrl(job);
// Returns: https://creatorsarea.fr/offres/associatif-responsable-communication-hf
```

### Types

#### `Job`

```typescript
interface Job {
  _id: string;              // MongoDB ObjectId
  title: string;            // Job title
  slug: string;             // URL-friendly slug
  content: string;          // Job description
  author: Author;           // Author information
  pricing: Pricing;         // Pricing information
  kind: JobKind;            // TEAM or COMMISSION
  status: JobStatus;        // ACTIVE, CLOSED, or DRAFT
  deadline: string | null;  // Application deadline
  _tags: Tag[];             // Associated tags
  threads: string[];        // Thread IDs
  thread?: string;          // Discord thread ID
  alerts: Alert[];          // Alert information
  createdAt: string;        // Creation timestamp
  updatedAt: string;        // Update timestamp
}
```

#### `Tag`

```typescript
interface Tag {
  _id: string;              // Tag ID
  name: string;             // Display name
  image: string;            // Image URL
  isActive?: boolean;       // Whether active
  createdAt?: string;       // Creation date
  updatedAt?: string;       // Update date
}
```

#### `Pricing`

```typescript
interface Pricing {
  value: number;            // Price (0 if volunteer)
  volunteer: boolean;       // Is volunteer work
  negotiable: boolean;      // Is price negotiable
}
```

#### `Author`

```typescript
interface Author {
  _id: string;              // User ID
  avatar: string;           // Avatar hash
  discord_id: string;       // Discord user ID
}
```

#### `Pagination`

```typescript
interface Pagination {
  totalItems: number;       // Total number of items
  totalPages: number;       // Total number of pages
  page: number;             // Current page (0-indexed)
}
```

#### `JobKind`

```typescript
enum JobKind {
  TEAM = 'TEAM',           // Team recruitment
  DEVELOPER = 'DEVELOPER', // Developer category
  DESIGNER = 'DESIGNER',   // Designer category
  EDITOR = 'EDITOR',       // Editor category
}
```

#### `JobStatus`

```typescript
enum JobStatus {
  ACTIVE = 'ACTIVE',       // Active job
  CLOSED = 'CLOSED',       // Closed job
  DRAFT = 'DRAFT',         // Draft job
}
```

### Exceptions

```typescript
import {
  CreatorsAreaError,  // Base exception
  APIError,           // API request failed
  NetworkError,       // Network error
  ValidationError,    // Invalid input or response
} from 'creatorsarea-ts';
```

#### Error Handling

The SDK automatically retries on:
- **429 (Rate Limit)**: Respects `Retry-After` header, uses exponential backoff
- **5xx (Server Errors)**: Retries with exponential backoff
- **Network Errors**: Retries failed connections

```typescript
import { APIError, NetworkError, ValidationError } from 'creatorsarea-ts';

try {
  const jobs = await client.getJobs();
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error ${error.statusCode}:`, error.message);
    // 429: Rate limited (already retried maxRetries times)
    // 4xx: Client error (bad request, not found, etc.)
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    // Connection failed, timeout, etc.
  } else if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
    // Invalid ObjectId, negative page number, etc.
  }
}
```

## Browser Support

Works in all modern browsers with `fetch` API support:
- Chrome/Edge 90+
- Firefox 90+
- Safari 14+
- Node.js 18+ (native fetch)

For older browsers, use a `fetch` polyfill like `whatwg-fetch`.

## Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const client = new CreatorsAreaClient({
  debug: true,
  requestDelay: 1000,
});

// Logs will show:
// [CreatorsAreaClient] Rate limiting: waiting 500ms
// [CreatorsAreaClient] Fetching (attempt 1/3): https://creatorsarea.fr/api/offers
// [CreatorsAreaClient] Rate limited (429). Retrying after 2000ms...
```

**When to use debug mode:**
- ✅ During development
- ✅ When troubleshooting rate limiting issues
- ✅ To understand retry behavior
- ❌ Not recommended in production (performance impact)

## Framework Examples

### Next.js (App Router)

```typescript
// app/jobs/page.tsx
import { CreatorsAreaClient } from 'creatorsarea-ts';

export default async function JobsPage() {
  const client = new CreatorsAreaClient();
  const { results: jobs } = await client.getJobs({ volunteer: true });

  return (
    <ul>
      {jobs.map(job => (
        <li key={job._id}>
          <a href={client.getJobUrl(job)}>{job.title}</a>
        </li>
      ))}
    </ul>
  );
}
```

### Express.js

```typescript
import express from 'express';
import { CreatorsAreaClient } from 'creatorsarea-ts';

const app = express();
const client = new CreatorsAreaClient();

app.get('/api/jobs', async (req, res) => {
  try {
    const data = await client.getJobs();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});
```

## Development

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Build the package
pnpm build

# Run examples
pnpm tsx examples/basic.ts
pnpm tsx examples/advanced.ts
pnpm tsx examples/query-builder-simple.ts
```

## Package Structure

```
src/
├── client.ts          # Main API client
├── query-builder.ts   # Query builder implementation
├── types.ts          # TypeScript type definitions
├── exceptions.ts     # Custom error classes
└── index.ts          # Public API exports

examples/
├── basic.ts                  # Basic usage examples
├── advanced.ts               # Advanced features demo
└── query-builder-simple.ts   # Query builder demo
```

## Best Practices

### 1. Configure Rate Limiting (Critical)

**Always configure proper delays** to avoid hitting rate limits:

```typescript
// ✅ RECOMMENDED - Safe for production
const client = new CreatorsAreaClient({
  requestDelay: 1000,  // 1 second between requests
  maxRetries: 3,
  retryDelay: 2000,
});

// ❌ NOT RECOMMENDED - Will likely hit rate limits
const client = new CreatorsAreaClient();
```

### 2. Use Pagination Wisely

```typescript
// ✅ Good - Process pages with delays
const allJobs = await client
  .query()
  .category('DESIGNER')
  .executeAll(1000, 10);  // Max 10 pages with 1s delay

// ✅ Better - Stream for memory efficiency
for await (const job of client.query().category('DESIGNER').stream(1000, 5)) {
  processJob(job);  // Process one at a time
}

// ❌ Bad - No delay, will hit rate limit
const allJobs = await client.query().executeAll(0);
```

### 3. Optimize Memory Usage

```typescript
// ❌ Bad - Loads everything into memory
const allJobs = await client.query().category('DESIGNER').executeAll();

// ✅ Good - Streams with limits
for await (const job of client.query().category('DESIGNER').stream(1000, 10)) {
  await processJob(job);  // Process one by one
}

// ✅ Also good - Paginate manually
let page = 0;
let hasMore = true;
while (hasMore && page < 5) {
  const { results, pagination } = await client.getJobs({ page });
  await processJobs(results);
  hasMore = page < pagination.totalPages - 1;
  page++;
  await new Promise(r => setTimeout(r, 1000));  // Manual delay
}
```

### 4. Handle Errors Properly

```typescript
import { APIError, NetworkError, ValidationError } from 'creatorsarea-ts';

try {
  const jobs = await client.getJobs({ page: 0 });
} catch (error) {
  if (error instanceof ValidationError) {
    // Input validation failed (invalid ID, negative page, etc.)
    console.error('Invalid input:', error.message);
  } else if (error instanceof APIError) {
    if (error.statusCode === 429) {
      // Rate limited even after retries - wait longer
      console.error('Rate limit exceeded. Wait before retrying.');
    } else {
      console.error(`API Error ${error.statusCode}:`, error.message);
    }
  } else if (error instanceof NetworkError) {
    // Network issues, timeout, etc.
    console.error('Network error:', error.message);
  }
}
```

### 5. Use Filters That Work

```typescript
// ✅ WORKS - Use category filter
const jobs = await client.getJobs({ category: 'DESIGNER' });

// ✅ WORKS - Filter by status
const activeJobs = await client.getJobs({ status: JobStatus.ACTIVE });

// ⚠️ MAY NOT WORK - volunteer filter is unreliable
const volunteerJobs = await client.getJobs({ volunteer: true });
// Workaround: Filter client-side
const filtered = jobs.filter(j => j.pricing.volunteer);

// ⚠️ MAY NOT WORK - kind filter is unreliable
// Use category instead
```

## API Reference Summary

### Client Methods

| Method | Description |
|--------|-------------|
| `getJobs(options?)` | Fetch jobs with optional filters |
| `getTags()` | Get all available tags |
| `getJobById(id)` | Get a specific job by ID |
| `getJobUrl(job)` | Build job URL from job or slug |
| `query()` | Create a query builder |

### Query Builder Methods

| Method | Description |
|--------|-------------|
| `category(cat)` | Filter by category |
| `volunteer(bool)` | Filter by volunteer status |
| `status(status)` | Filter by job status |
| `kind(kind)` | Filter by job kind |
| `tags(ids)` | Filter by tag IDs |
| `addTag(id)` | Add a single tag filter |
| `page(num)` | Set page number |
| `execute()` | Execute query |
| `executeAndGetResults()` | Get only results array |
| `executeAll(delay?)` | Get all pages |
| `stream(delay?)` | Stream results |
| `count()` | Count matching jobs |
| `build()` | Build options object |
| `reset()` | Reset all filters |

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

MIT © [Sycatle](https://github.com/Sycatle)

## Links

- [npm Package](https://www.npmjs.com/package/creatorsarea-ts)
- [GitHub Repository](https://github.com/Sycatle/creatorsarea-ts)
- [CreatorsArea.fr](https://creatorsarea.fr)
- [Python SDK](https://pypi.org/project/creatorsarea-py/)

---

Made with ❤️ for the freelance community
