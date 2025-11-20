import { CreatorsAreaClient } from '../src';

async function main() {
  // Create client
  const client = new CreatorsAreaClient();

  console.log('Fetching jobs from CreatorsArea...\n');

  // Get volunteer jobs from first page
  const { results, pagination } = await client.getJobs({
    volunteer: true,
  });

  console.log(`Found ${results.length} jobs on page ${pagination.page + 1}/${pagination.totalPages}`);
  console.log(`Total jobs: ${pagination.totalItems}\n`);

  // Display first 5 jobs
  results.slice(0, 5).forEach((job, index) => {
    console.log(`${index + 1}. ${job.title}`);
    console.log(`   ID: ${job._id}`);
    console.log(`   Slug: ${job.slug}`);
    console.log(`   URL: ${client.getJobUrl(job)}`);
    console.log(`   Kind: ${job.kind}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Price: ${job.pricing.volunteer ? 'Volunteer' : `${job.pricing.value}€`}`);
    console.log(`   Tags: ${job._tags.map(t => t.name).join(', ')}`);
    console.log(`   Created: ${new Date(job.createdAt).toLocaleDateString()}\n`);
  });

  // Get all available tags
  console.log('\nFetching available tags...\n');
  const tags = await client.getTags();
  console.log(`Found ${tags.length} tags:`);
  tags.slice(0, 10).forEach(tag => {
    console.log(`  - ${tag.name} (ID: ${tag._id})`);
  });
}

main().catch(console.error);
