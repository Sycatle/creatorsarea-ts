# creatorsarea-ts

> TypeScript/JavaScript SDK for the [CreatorsArea.fr](https://creatorsarea.fr) job marketplace API

[![npm version](https://img.shields.io/npm/v/creatorsarea-ts.svg)](https://www.npmjs.com/package/creatorsarea-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## Features

✅ **Full TypeScript support** with complete type definitions  
✅ **Modern async/await API**  
✅ **Tree-shakeable** ESM and CJS builds  
✅ **Zero dependencies** (uses native fetch)  
✅ **Lightweight** (~5KB minified)  
✅ **Browser and Node.js** compatible  

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
import { CreatorsAreaClient, Category } from 'creatorsarea-ts';

const client = new CreatorsAreaClient();

// Get developer jobs
const jobs = await client.getJobs({
  category: Category.DEVELOPER,
  limit: 10,
});

console.log(jobs);
```

## Usage

### Basic Example

```typescript
import { CreatorsAreaClient, Category } from 'creatorsarea-ts';

const client = new CreatorsAreaClient();

// Fetch jobs by category
const devJobs = await client.getJobs({
  category: Category.DEVELOPER,
  limit: 5,
});

devJobs.forEach(job => {
  console.log(`${job.title} - ${job.budget || 'TBD'}`);
});
```

### Advanced Example

```typescript
import { CreatorsAreaClient, Category, type Job } from 'creatorsarea-ts';

// Custom configuration
const client = new CreatorsAreaClient({
  timeout: 15000, // 15 seconds
  userAgent: 'MyApp/1.0',
});

try {
  // Get all jobs
  const allJobs = await client.getJobs();

  // Filter jobs with budget
  const paidJobs = allJobs.filter((job: Job) => job.budget);

  // Get specific job by ID
  const job = await client.getJobById('creatorsarea_abc123');
  
  if (job) {
    console.log(job.title);
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
import { CreatorsAreaClient, Category } from 'creatorsarea-ts';

const client = new CreatorsAreaClient();

function useJobs(category: Category, limit?: number) {
  return useQuery({
    queryKey: ['creatorsarea-jobs', category, limit],
    queryFn: () => client.getJobs({ category, limit }),
  });
}

// In your component
function JobsList() {
  const { data: jobs, isLoading } = useJobs(Category.DEVELOPER, 10);

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {jobs?.map(job => (
        <li key={job.id}>{job.title}</li>
      ))}
    </ul>
  );
}
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

#### Methods

##### `getJobs(options?): Promise<Job[]>`

Fetch jobs from CreatorsArea.

**Parameters:**
- `options.category?: Category` - Filter by category
- `options.limit?: number` - Maximum number of jobs

**Returns:** `Promise<Job[]>`

**Throws:**
- `APIError` - API request failed
- `NetworkError` - Network error
- `ValidationError` - Invalid response

**Example:**
```typescript
const jobs = await client.getJobs({
  category: Category.DEVELOPER,
  limit: 20,
});
```

##### `getJobById(jobId): Promise<Job | null>`

Get a single job by ID.

**Parameters:**
- `jobId: string` - Job ID (with or without `creatorsarea_` prefix)

**Returns:** `Promise<Job | null>`

**Example:**
```typescript
const job = await client.getJobById('creatorsarea_123abc');
```

### Types

#### `Job`

```typescript
interface Job {
  id: string;              // Unique identifier
  title: string;           // Job title
  url: string;             // Full URL
  source: string;          // Always 'creatorsarea'
  description?: string;    // Job description
  budget?: string;         // Budget info
  category?: string;       // Job category
  applications?: string;   // Number of applications
  createdAt?: Date;        // Creation date
}
```

#### `Category`

```typescript
enum Category {
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  MARKETING = 'MARKETING',
  WRITER = 'WRITER',
  OTHER = 'OTHER',
}
```

### Exceptions

```typescript
import {
  CreatorsAreaError,  // Base exception
  APIError,           // API request failed
  NetworkError,       // Network error
  ValidationError,    // Invalid response
} from 'creatorsarea-ts';
```

## Browser Support

Works in all modern browsers with `fetch` API support:
- Chrome/Edge 90+
- Firefox 90+
- Safari 14+
- Node.js 18+ (native fetch)

For older browsers, use a `fetch` polyfill like `whatwg-fetch`.

## Framework Examples

### Next.js (App Router)

```typescript
// app/jobs/page.tsx
import { CreatorsAreaClient, Category } from 'creatorsarea-ts';

export default async function JobsPage() {
  const client = new CreatorsAreaClient();
  const jobs = await client.getJobs({ category: Category.DEVELOPER });

  return (
    <ul>
      {jobs.map(job => (
        <li key={job.id}>{job.title}</li>
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
    const jobs = await client.getJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run examples
pnpm tsx examples/basic.ts
```

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
