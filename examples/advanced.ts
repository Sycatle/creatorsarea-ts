import { CreatorsAreaClient, JobKind, JobStatus, type Job } from '../src';

async function main() {
  const client = new CreatorsAreaClient({
    timeout: 15000, // 15 seconds
  });

  try {
    console.log('Fetching all tags...\n');

    // Get all tags first
    const tags = await client.getTags();
    console.log(`Total tags available: ${tags.length}\n`);

    // Find specific tags (e.g., "Plugin Minecraft" and "Site web")
    const minecraftTag = tags.find(t => t.name.toLowerCase().includes('minecraft'));
    const webTag = tags.find(t => t.name.toLowerCase().includes('site web'));

    if (minecraftTag) {
      console.log(`\nFetching jobs with tag: ${minecraftTag.name}...\n`);

      const { results, pagination } = await client.getJobs({
        tags: [minecraftTag._id],
        kind: JobKind.TEAM,
      });

      console.log(`Found ${results.length} jobs on page 1 of ${pagination.totalPages}`);
      console.log(`Total matching jobs: ${pagination.totalItems}\n`);

      // Display jobs
      results.slice(0, 3).forEach((job: Job, index: number) => {
        console.log(`${index + 1}. ${job.title}`);
        console.log(`   URL: ${client.getJobUrl(job)}`);
        console.log(`   Kind: ${job.kind}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Pricing: ${job.pricing.volunteer ? 'Volunteer' : `${job.pricing.value}€`} ${job.pricing.negotiable ? '(negotiable)' : ''}`);
        console.log(`   Tags: ${job._tags.map(t => t.name).join(', ')}`);
        console.log(`   Author Discord: ${job.author.discord_id}`);
        console.log(`   Description: ${job.content.substring(0, 150)}...`);
        console.log();
      });
    }

    // Fetch paginated results
    console.log('\nFetching page 2 of all active jobs...\n');
    const { results: page2, pagination: pagination2 } = await client.getJobs({
      page: 1, // 0-indexed, so page 1 = second page
      status: JobStatus.ACTIVE,
    });

    console.log(`Page 2 contains ${page2.length} jobs`);
    console.log(`Currently on page ${pagination2.page + 1} of ${pagination2.totalPages}`);

    // Get a specific job by ID
    if (page2.length > 0) {
      const firstJob = page2[0];
      console.log(`\nFetching details for job ID: ${firstJob._id}`);
      
      const detailedJob = await client.getJobById(firstJob._id);
      
      if (detailedJob) {
        console.log('\nDetailed Job Information:');
        console.log(`  Title: ${detailedJob.title}`);
        console.log(`  Slug: ${detailedJob.slug}`);
        console.log(`  URL: ${client.getJobUrl(detailedJob)}`);
        console.log(`  Content: ${detailedJob.content.substring(0, 200)}...`);
        console.log(`  Created: ${new Date(detailedJob.createdAt).toLocaleString()}`);
        console.log(`  Updated: ${new Date(detailedJob.updatedAt).toLocaleString()}`);
        if (detailedJob.deadline) {
          console.log(`  Deadline: ${new Date(detailedJob.deadline).toLocaleString()}`);
        }
        console.log(`  Thread ID: ${detailedJob.thread || 'N/A'}`);
        console.log(`  Alerts: ${detailedJob.alerts.length}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
