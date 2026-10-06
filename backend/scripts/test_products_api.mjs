import { query } from '../config/db.js';
import { listProducts } from '../controllers/productController.js';

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

async function runProductTests() {
  console.log('=== TEST 4: Product Query Pagination & Range Filters Stress Testing ===');
  let failures = [];

  // Helper function to call listProducts
  async function callProducts(queryParams) {
    const req = { query: queryParams };
    const res = mockRes();
    await listProducts(req, res);
    return { status: res.statusCode, data: res.body };
  }

  // ─── 1. PAGINATION TESTS ───────────────────────────────────────────
  console.log('\n--- 1. Testing Pagination ---');

  // Test limit=4
  {
    const { status, data } = await callProducts({ limit: '4' });
    console.log(`limit=4: status=${status}, items=${data.items?.length}, total=${data.total}, limit=${data.limit}`);
    if (status !== 200) failures.push(`limit=4 failed with status ${status}`);
    if (data.items?.length !== 4) failures.push(`limit=4: expected 4 items, got ${data.items?.length}`);
    if (data.limit !== 4 || data.perPage !== 4) failures.push(`limit=4: response limit/perPage not 4 (got ${data.limit})`);
  }

  // Test limit=100
  {
    const { status, data } = await callProducts({ limit: '100' });
    console.log(`limit=100: status=${status}, items=${data.items?.length}, total=${data.total}, limit=${data.limit}, pages=${data.pages}`);
    if (status !== 200) failures.push(`limit=100 failed with status ${status}`);
    if (data.items?.length !== data.total) failures.push(`limit=100: expected all ${data.total} items, got ${data.items?.length}`);
    if (data.limit !== 100) failures.push(`limit=100: response limit not 100 (got ${data.limit})`);
    if (data.pages !== 1) failures.push(`limit=100: expected 1 page, got ${data.pages}`);
  }

  // Test limit=0 (should fallback to default 12)
  {
    const { status, data } = await callProducts({ limit: '0' });
    console.log(`limit=0: status=${status}, limit=${data.limit}`);
    if (data.limit !== 12) failures.push(`limit=0: expected default limit 12, got ${data.limit}`);
  }

  // Test limit=-5 (should fallback to default 12)
  {
    const { status, data } = await callProducts({ limit: '-5' });
    console.log(`limit=-5: status=${status}, limit=${data.limit}`);
    if (data.limit !== 12) failures.push(`limit=-5: expected default limit 12, got ${data.limit}`);
  }

  // Test limit=invalid_string (should fallback to default 12)
  {
    const { status, data } = await callProducts({ limit: 'abc' });
    console.log(`limit=abc: status=${status}, limit=${data.limit}`);
    if (data.limit !== 12) failures.push(`limit=abc: expected default limit 12, got ${data.limit}`);
  }

  // Test limit > 500 (capped at 500)
  {
    const { status, data } = await callProducts({ limit: '999' });
    console.log(`limit=999: status=${status}, limit=${data.limit}`);
    if (data.limit !== 500) failures.push(`limit=999: expected capped limit 500, got ${data.limit}`);
  }

  // Test perPage fallback when limit is omitted
  {
    const { status, data } = await callProducts({ perPage: '6' });
    console.log(`perPage=6 (no limit): status=${status}, limit=${data.limit}, items=${data.items?.length}`);
    if (data.limit !== 6) failures.push(`perPage=6: expected limit 6, got ${data.limit}`);
    if (data.items?.length !== 6) failures.push(`perPage=6: expected 6 items, got ${data.items?.length}`);
  }

  // ─── 2. RANGE FILTER TESTS ─────────────────────────────────────────
  console.log('\n--- 2. Testing Range Filters ---');

  // Test r_tonnage=1.4-1.7
  {
    const { status, data } = await callProducts({ r_tonnage: '1.4-1.7' });
    console.log(`r_tonnage=1.4-1.7: status=${status}, count=${data.items?.length}`);
    if (status !== 200) failures.push(`r_tonnage=1.4-1.7 returned status ${status}`);
    if (!data.items || data.items.length === 0) {
      failures.push('r_tonnage=1.4-1.7: expected matching products, got 0');
    } else {
      for (const prod of data.items) {
        const tonnage = parseFloat(prod.specs?.tonnage);
        console.log(`   Product ${prod.id} (${prod.title}): tonnage=${tonnage}`);
        if (isNaN(tonnage) || tonnage < 1.4 || tonnage > 1.7) {
          failures.push(`r_tonnage=1.4-1.7: Product ${prod.id} tonnage ${tonnage} out of range [1.4, 1.7]`);
        }
      }
    }
  }

  // Test r_price=20000-40000
  {
    const { status, data } = await callProducts({ r_price: '20000-40000' });
    console.log(`r_price=20000-40000: status=${status}, count=${data.items?.length}`);
    if (status !== 200) failures.push(`r_price=20000-40000 returned status ${status}`);
    if (!data.items || data.items.length === 0) {
      failures.push('r_price=20000-40000: expected matching products, got 0');
    } else {
      for (const prod of data.items) {
        const effPrice = parseFloat(prod.discount_price ?? prod.base_price);
        if (effPrice < 20000 || effPrice > 40000) {
          failures.push(`r_price=20000-40000: Product ${prod.id} price ${effPrice} out of range [20000, 40000]`);
        }
      }
    }
  }

  // Test half-open range: r_tonnage=1.5- (min only)
  {
    const { status, data } = await callProducts({ r_tonnage: '1.5-' });
    console.log(`r_tonnage=1.5- (lower bound): status=${status}, count=${data.items?.length}`);
    if (status !== 200) failures.push(`r_tonnage=1.5- returned status ${status}`);
    for (const prod of (data.items || [])) {
      const tonnage = parseFloat(prod.specs?.tonnage);
      if (isNaN(tonnage) || tonnage < 1.5) {
        failures.push(`r_tonnage=1.5-: Product ${prod.id} tonnage ${tonnage} < 1.5`);
      }
    }
  }

  // Test half-open range: r_tonnage=-1.5 (upper bound)
  {
    const { status, data } = await callProducts({ r_tonnage: '-1.5' });
    console.log(`r_tonnage=-1.5 (upper bound): status=${status}, count=${data.items?.length}`);
    if (status !== 200) failures.push(`r_tonnage=-1.5 returned status ${status}`);
    for (const prod of (data.items || [])) {
      const tonnage = parseFloat(prod.specs?.tonnage);
      if (isNaN(tonnage) || tonnage > 1.5) {
        failures.push(`r_tonnage=-1.5: Product ${prod.id} tonnage ${tonnage} > 1.5`);
      }
    }
  }

  // Test inverted range: r_tonnage=1.7-1.4 (should auto-swap)
  {
    const { status, data } = await callProducts({ r_tonnage: '1.7-1.4' });
    console.log(`r_tonnage=1.7-1.4 (inverted): status=${status}, count=${data.items?.length}`);
    if (status !== 200) failures.push(`r_tonnage=1.7-1.4 returned status ${status}`);
    if (!data.items || data.items.length === 0) {
      failures.push('r_tonnage=1.7-1.4 (inverted): expected auto-swap and matching products, got 0');
    }
  }

  // ─── 3. MALFORMED RANGE VALUES ─────────────────────────────────────
  console.log('\n--- 3. Testing Malformed Range Values ---');

  const malformedCases = [
    { desc: 'Non-numeric string value', query: { r_tonnage: 'abc' } },
    { desc: 'Double dash', query: { r_tonnage: '--' } },
    { desc: 'Partial alphanumeric min', query: { r_tonnage: '1.5ton-2ton' } },
    { desc: 'Whitespace only', query: { r_tonnage: '   -   ' } },
    { desc: 'Empty range', query: { r_tonnage: '' } },
    { desc: 'Malformed price range', query: { r_price: 'expensive-cheap' } },
    { desc: 'Malformed price dash only', query: { r_price: '-' } },
  ];

  for (const mc of malformedCases) {
    try {
      const { status, data } = await callProducts(mc.query);
      console.log(`${mc.desc}: status=${status}, total=${data.total}`);
      if (status !== 200) {
        failures.push(`${mc.desc}: expected status 200 graceful handling, got ${status}`);
      }
      if (!Array.isArray(data.items)) {
        failures.push(`${mc.desc}: data.items is not an array`);
      }
    } catch (e) {
      failures.push(`${mc.desc}: Unhandled exception: ${e.message}`);
    }
  }

  // ─── 4. SQL INJECTION ATTEMPTS ─────────────────────────────────────
  console.log('\n--- 4. Testing SQL Injection Attempts ---');

  const sqliCases = [
    { desc: 'SQLi in range param name (quotes & statement end)', query: { "r_tonnage'; DROP TABLE products;--": '1.4-1.7' } },
    { desc: 'SQLi in range param name (UNION SELECT)', query: { "r_spec' UNION SELECT * FROM users--": '1-10' } },
    { desc: 'SQLi in range param name (spec injection)', query: { 'r_specs->>"x"': '1-10' } },
    { desc: 'SQLi in range param name (spaces & operators)', query: { 'r_tonnage OR 1=1': '1.4-1.7' } },
    { desc: 'SQLi in range param value (semicolon & comment)', query: { r_tonnage: '1; DROP TABLE products;--' } },
    { desc: 'SQLi in range param value (OR 1=1)', query: { r_tonnage: "1.4' OR '1'='1" } },
    { desc: 'SQLi in r_price value (UNION SELECT)', query: { r_price: "20000; SELECT 1 FROM pg_user;--" } },
    { desc: 'SQLi in price query param', query: { price: "20000 OR 1=1-40000" } },
    { desc: 'SQLi in q search param', query: { q: "' OR 1=1; --" } },
    { desc: 'SQLi in f_ filter key', query: { "f_color'; DROP TABLE products;--": 'Black' } },
    { desc: 'SQLi in f_ filter val', query: { f_color: "Black', 'White'); DROP TABLE products;--" } },
  ];

  for (const sqli of sqliCases) {
    try {
      const { status, data } = await callProducts(sqli.query);
      console.log(`SQLi attempt [${sqli.desc}]: status=${status}, total=${data?.total ?? 'N/A'}`);
      if (status >= 500) {
        failures.push(`SQLi test [${sqli.desc}] crashed with status ${status}: ${data?.error}`);
      }
    } catch (e) {
      failures.push(`SQLi test [${sqli.desc}] caused unhandled exception: ${e.message}`);
    }
  }

  // Verify database integrity after SQLi attempts (products table still exists and has all rows)
  const integrityCheck = await query('SELECT COUNT(*)::int as count FROM products');
  console.log('\nPost-test products count:', integrityCheck.rows[0].count);
  if (integrityCheck.rows[0].count !== 40) {
    failures.push(`Database integrity compromised! Products count is ${integrityCheck.rows[0].count}, expected 40`);
  }

  if (failures.length > 0) {
    console.log('\n❌ TEST 4 FAILED with issues:', failures);
    process.exit(1);
  } else {
    console.log('\n✅ TEST 4 PASSED: All product query pagination, range filters, and SQLi tests passed!');
    process.exit(0);
  }
}

runProductTests();
