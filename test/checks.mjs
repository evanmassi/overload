let passed = 0;
let failed = 0;

export function section(name){ console.log("\n" + name); }

export function check(label, condition, detail){
  if(condition){ passed++; console.log("  PASS  " + label); return; }
  failed++;
  console.log("  FAIL  " + label + (detail === undefined ? "" : "  -> " + detail));
}

export function equal(label, got, want){
  const same = JSON.stringify(got) === JSON.stringify(want);
  check(label, same, same ? undefined : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
}

export function report(){
  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}
