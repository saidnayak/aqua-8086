import { runAllTests } from "../src/features/simulation/tests/simulation.test";

console.log("=================================================");
console.log(" AQUA8086 AUTOMATED SIMULATION ENGINE TESTS ");
console.log("=================================================");

const { passed, failed, results } = runAllTests();

for (const res of results) {
  if (res.success) {
    console.log(`  ✓ [PASS] ${res.name}`);
  } else {
    console.log(`  ✗ [FAIL] ${res.name}: ${res.message}`);
  }
}

console.log("-------------------------------------------------");
console.log(`Summary: ${passed} Passed, ${failed} Failed (Total: ${results.length})`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

