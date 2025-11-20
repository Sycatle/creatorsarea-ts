import { CreatorsAreaClient, Category, type Job } from '../src';

async function main() {
  const client = new CreatorsAreaClient({
    timeout: 15000, // 15 seconds
  });

  try {
    console.log('Fetching all developer jobs...\n');

    const jobs = await client.getJobs({
      category: Category.DEVELOPER,
    });

    console.log(`Total jobs found: ${jobs.length}\n`);

    // Filter jobs with budget info
    const jobsWithBudget = jobs.filter((job: Job) => job.budget);
    console.log(`Jobs with budget: ${jobsWithBudget.length}`);

    // Get a specific job by ID
    if (jobs.length > 0) {
      const firstJob = jobs[0];
      console.log(`\nFetching details for: ${firstJob.title}`);
      
      const detailedJob = await client.getJobById(firstJob.id);
      
      if (detailedJob) {
        console.log('Details:');
        console.log(`  Title: ${detailedJob.title}`);
        console.log(`  Description: ${detailedJob.description?.substring(0, 100)}...`);
        console.log(`  Applications: ${detailedJob.applications || 'Unknown'}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
