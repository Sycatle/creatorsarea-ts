import { CreatorsAreaClient, Category } from '../src';

async function main() {
  // Create client
  const client = new CreatorsAreaClient();

  console.log('Fetching jobs from CreatorsArea...\n');

  // Get developer jobs
  const jobs = await client.getJobs({
    category: Category.DEVELOPER,
    limit: 5,
  });

  console.log(`Found ${jobs.length} jobs:\n`);

  jobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.title}`);
    console.log(`   ID: ${job.id}`);
    console.log(`   URL: ${job.url}`);
    console.log(`   Budget: ${job.budget || 'Not specified'}`);
    console.log(`   Category: ${job.category || 'N/A'}\n`);
  });
}

main().catch(console.error);
