import { execSync } from "child_process";

async function runAllTests() {
  console.log("=================================================");
  console.log("🚀 CineBook QA Agent: Comprehensive Test Suite");
  console.log("=================================================\n");

  const testFiles = [
    { name: "Auth & Security Validation", script: "scripts/test-auth-security.ts" },
    { name: "Concurrent Seat Booking Race Conditions", script: "scripts/test-concurrency.ts" },
    { name: "Expired Seat Hold Automatic Release", script: "scripts/test-expired-holds.ts" },
    { name: "Payment Idempotency & Webhook Replay", script: "scripts/test-idempotency.ts" },
  ];

  let passed = 0;

  for (const t of testFiles) {
    console.log(`\n▶️ Running: ${t.name}...`);
    try {
      execSync(`npx tsx ${t.script}`, { stdio: "inherit" });
      passed++;
    } catch (err) {
      console.error(`❌ Test failed: ${t.name}`);
      process.exit(1);
    }
  }

  console.log("\n=================================================");
  console.log(`✅ All ${passed}/${testFiles.length} Test Suites Passed Successfully!`);
  console.log("=================================================\n");
}

runAllTests();
