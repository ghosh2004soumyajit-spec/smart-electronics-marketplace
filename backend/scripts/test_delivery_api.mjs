import { query } from '../config/db.js';
import { checkPincode } from '../controllers/deliveryController.js';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runDeliveryTests() {
  console.log('=== TEST 2: Delivery Pincode API Stress Testing ===');
  let failures = [];

  // Check what zones exist in DB
  const zonesRes = await query('SELECT * FROM delivery_zones');
  console.log('Available delivery zones count:', zonesRes.rowCount);
  console.log('Sample delivery zones:', zonesRes.rows.slice(0, 5));

  const testCases = [
    { desc: 'Known exact pincode (Bengaluru)', pin: '560001', expectedServiceable: true },
    { desc: 'Known exact pincode (Delhi)', pin: '110001', expectedServiceable: true },
    { desc: '3-digit prefix matching (Bengaluru 560999)', pin: '560999', expectedServiceable: true },
    { desc: '3-digit prefix matching (Delhi 110888)', pin: '110888', expectedServiceable: true },
    { desc: '3-digit prefix matching (Mumbai 400777)', pin: '400777', expectedServiceable: true },
    { desc: 'Unserviceable pincode (999999)', pin: '999999', expectedServiceable: false },
    { desc: 'Unserviceable pincode (000000)', pin: '000000', expectedServiceable: false },
    { desc: 'Invalid pincode format (short 123)', pin: '123', expectStatus: 400, expectedServiceable: false },
    { desc: 'Invalid pincode format (letters abc)', pin: 'abc', expectStatus: 400, expectedServiceable: false },
    { desc: 'Invalid pincode format (alphanumeric 56000a)', pin: '56000a', expectStatus: 400, expectedServiceable: false },
    { desc: 'Invalid pincode format (too long 5600011)', pin: '5600011', expectStatus: 400, expectedServiceable: false },
    { desc: 'Invalid pincode format (spaces)', pin: '      ', expectStatus: 400, expectedServiceable: false },
    { desc: 'SQL injection attempt (560001 OR 1=1)', pin: '560001 OR 1=1', expectStatus: 400, expectedServiceable: false },
  ];

  for (const tc of testCases) {
    // Test both via params and query
    for (const mode of ['params', 'query']) {
      const req = {
        params: mode === 'params' ? { pincode: tc.pin } : {},
        query: mode === 'query' ? { pincode: tc.pin } : {},
      };
      const res = mockRes();

      await checkPincode(req, res);

      const status = res.statusCode;
      const data = res.body;

      console.log(`[${tc.desc} (${mode})] -> HTTP ${status}`, data);

      if (tc.expectStatus && status !== tc.expectStatus) {
        failures.push(`${tc.desc} (${mode}): Expected HTTP ${tc.expectStatus}, got ${status}`);
      }

      if (tc.expectedServiceable !== undefined && data.serviceable !== tc.expectedServiceable) {
        failures.push(`${tc.desc} (${mode}): Expected serviceable: ${tc.expectedServiceable}, got: ${data.serviceable}`);
      }

      // Check for NaN or string "NaN" or "undefined"
      for (const [k, v] of Object.entries(data)) {
        if (Number.isNaN(v) || v === 'NaN' || v === 'undefined' || v === undefined) {
          failures.push(`${tc.desc} (${mode}): Field ${k} has invalid value: ${v}`);
        }
      }

      // If serviceable, verify required contract fields
      if (data.serviceable) {
        if (!data.city || typeof data.city !== 'string') {
          failures.push(`${tc.desc} (${mode}): Missing or invalid city: ${data.city}`);
        }
        if (!data.region || typeof data.region !== 'string') {
          failures.push(`${tc.desc} (${mode}): Missing or invalid region: ${data.region}`);
        }
        if (typeof data.charge !== 'number' || isNaN(data.charge)) {
          failures.push(`${tc.desc} (${mode}): Missing or invalid charge: ${data.charge}`);
        }
        if (typeof data.freeAbove !== 'number' || isNaN(data.freeAbove)) {
          failures.push(`${tc.desc} (${mode}): Missing or invalid freeAbove: ${data.freeAbove}`);
        }
        if (typeof data.etaDays !== 'number' || isNaN(data.etaDays)) {
          failures.push(`${tc.desc} (${mode}): Missing or invalid etaDays: ${data.etaDays}`);
        }
        if (!data.etaLabel || typeof data.etaLabel !== 'string') {
          failures.push(`${tc.desc} (${mode}): Missing or invalid etaLabel: ${data.etaLabel}`);
        }
      }
    }
  }

  if (failures.length > 0) {
    console.log('\n❌ TEST 2 FAILED with issues:', failures);
    process.exit(1);
  } else {
    console.log('\n✅ TEST 2 PASSED: All delivery pincode test cases passed!');
    process.exit(0);
  }
}

runDeliveryTests();
