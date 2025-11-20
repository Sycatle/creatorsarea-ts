import { CreatorsAreaClient, JobStatus } from '../src';

async function main() {
  const client = new CreatorsAreaClient();

  console.log('🔨 Query Builder Examples\n');

  // Example 1: Simple query with method chaining
  console.log('Example 1: Simple query with chaining');
  const { results: designerJobs, pagination: p1 } = await client
    .query()
    .category('DESIGNER')
    .volunteer(false)
    .execute();
  
  console.log(`✅ Found ${designerJobs.length} paid designer jobs`);
  console.log(`   Page ${p1.page + 1}/${p1.totalPages}\n`);

  // Example 2: Complex query with multiple filters
  console.log('Example 2: Complex query with multiple filters');
  const { results: activeJobs, pagination: p2 } = await client
    .query()
    .category('DEVELOPER')
    .status(JobStatus.ACTIVE)
    .page(0)
    .execute();
  
  console.log(`✅ Found ${activeJobs.length} active developer jobs`);
  console.log(`   Total: ${p2.totalItems}\n`);

  // Example 3: Get all jobs from all pages automatically
  console.log('Example 3: Get ALL designer jobs (all pages with delay)');
  const allDesignerJobs = await client
    .query()
    .category('DESIGNER')
    .executeAll(1000); // 1 second delay between requests
  
  console.log(`✅ Retrieved ${allDesignerJobs.length} designer jobs from all pages\n`);

  // Example 4: Count jobs without fetching all data
  console.log('Example 4: Count volunteer jobs');
  const volunteerCount = await client
    .query()
    .volunteer(true)
    .count();
  
  console.log(`✅ Found ${volunteerCount} volunteer jobs total\n`);

  // Example 5: Stream jobs for memory-efficient processing
  console.log('Example 5: Stream volunteer jobs (memory-efficient, max 5 shown)');
  let streamCount = 0;
  const query = client.query().volunteer(true);
  
  for await (const job of query.stream(800)) { // 800ms delay
    streamCount++;
    if (streamCount <= 5) {
      console.log(`   ${streamCount}. ${job.title}`);
    }
    if (streamCount >= 5) break; // Only process first 5 to avoid rate limit
  }
  console.log(`✅ Streamed ${streamCount} jobs\n`);

  // Example 6: Add tags dynamically
  console.log('Example 6: Query with dynamic tag addition');
  const tags = await client.getTags();
  const webTag = tags.find(t => t.name.toLowerCase().includes('site web'));
  
  if (webTag) {
    const query2 = client
      .query()
      .category('DEVELOPER')
      .addTag(webTag._id);
    
    const count = await query2.count();
    console.log(`✅ Found ${count} developer jobs with "Site web" tag\n`);
  }

  // Example 7: Build options without executing
  console.log('Example 7: Build query options');
  const options = client
    .query()
    .category('EDITOR')
    .status(JobStatus.ACTIVE)
    .volunteer(true)
    .build();
  
  console.log('✅ Built query options:', options);
  console.log();

  // Example 8: Reset and reuse query builder
  console.log('Example 8: Reset and reuse builder');
  const builder = client.query().category('DESIGNER').volunteer(true);
  
  const count1 = await builder.count();
  console.log(`   Volunteer designers: ${count1}`);
  
  builder.reset().category('DEVELOPER').volunteer(true);
  const count2 = await builder.count();
  console.log(`   Volunteer developers: ${count2}`);
  console.log();

  // Example 9: Execute and get only results (no pagination)
  console.log('Example 9: Get only results array');
  const jobs = await client
    .query()
    .category('TEAM')
    .executeAndGetResults();
  
  console.log(`✅ Got ${jobs.length} team jobs (array only)\n`);

  // Example 10: Complex real-world scenario
  console.log('Example 10: Real-world scenario - Active paid designer jobs');
  const results = await client
    .query()
    .category('DESIGNER')
    .status(JobStatus.ACTIVE)
    .volunteer(false)
    .page(0)
    .execute();
  
  console.log(`✅ Found ${results.results.length} jobs matching criteria:`);
  results.results.slice(0, 3).forEach((job, i) => {
    console.log(`   ${i + 1}. ${job.title}`);
    console.log(`      Price: ${job.pricing.value}€ ${job.pricing.negotiable ? '(negotiable)' : ''}`);
    console.log(`      Tags: ${job._tags.map(t => t.name).join(', ')}`);
  });

  console.log('\n✅ All query builder examples completed! 🎉');
}

main().catch(console.error);
