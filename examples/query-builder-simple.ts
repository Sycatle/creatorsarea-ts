import { CreatorsAreaClient, JobStatus } from '../src';

async function main() {
  const client = new CreatorsAreaClient();

  console.log('🔨 Query Builder Quick Demo\n');

  try {
    // Example 1: Simple query
    console.log('Example 1: Designer jobs query');
    const { results, pagination } = await client
      .query()
      .category('DESIGNER')
      .execute();
    
    console.log(`✅ Found ${results.length} jobs (Page ${pagination.page + 1}/${pagination.totalPages})`);
    if (results.length > 0) {
      console.log(`   First: "${results[0].title}"`);
    }
    console.log();

    // Wait to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Example 2: Count without fetching all
    console.log('Example 2: Count volunteer jobs');
    const count = await client.query().volunteer(true).count();
    console.log(`✅ ${count} volunteer jobs available\n`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Example 3: Complex query
    console.log('Example 3: Active developer jobs');
    const devQuery = client.query()
      .category('DEVELOPER')
      .status(JobStatus.ACTIVE);
    
    const { results: devJobs } = await devQuery.execute();
    console.log(`✅ Found ${devJobs.length} active developer jobs\n`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Example 4: Build options
    console.log('Example 4: Build query options');
    const options = client.query()
      .category('EDITOR')
      .volunteer(true)
      .build();
    
    console.log('✅ Options:', JSON.stringify(options, null, 2));
    console.log();

    // Example 5: Stream (limited)
    console.log('Example 5: Stream first 3 volunteer jobs');
    let count2 = 0;
    for await (const job of client.query().volunteer(true).stream(1500)) {
      console.log(`   ${++count2}. ${job.title}`);
      if (count2 >= 3) break;
    }
    console.log();

    console.log('✅ Query builder demo completed! 🎉');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

main();
