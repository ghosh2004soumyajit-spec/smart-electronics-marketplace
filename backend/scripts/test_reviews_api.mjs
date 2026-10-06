import { query } from '../config/db.js';
import { listProductReviews } from '../controllers/reviewController.js';

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

async function runReviewTests() {
  console.log('=== TEST 3: Product Reviews API Stress Testing ===');
  let failures = [];

  // Find products with reviews and without reviews
  const reviewCounts = await query(`
    SELECT p.id, p.slug, p.title, COUNT(r.id)::int as review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    GROUP BY p.id, p.slug, p.title
    ORDER BY review_count DESC
  `);

  const prodWithReviews = reviewCounts.rows.find(p => p.review_count > 0);
  const prodWithoutReviews = reviewCounts.rows.find(p => p.review_count === 0);

  console.log('Product WITH reviews:', prodWithReviews);
  console.log('Product WITHOUT reviews:', prodWithoutReviews);

  if (!prodWithReviews) {
    failures.push('No product with reviews found in database!');
  }
  if (!prodWithoutReviews) {
    failures.push('No product without reviews found in database!');
  }

  const testCases = [
    { desc: 'Product WITH reviews (by ID)', productId: String(prodWithReviews?.id), expectReviews: true },
    { desc: 'Product WITH reviews (by Slug)', productId: prodWithReviews?.slug, expectReviews: true },
    { desc: 'Product WITHOUT reviews (by ID)', productId: String(prodWithoutReviews?.id), expectReviews: false },
    { desc: 'Product WITHOUT reviews (by Slug)', productId: prodWithoutReviews?.slug, expectReviews: false },
    { desc: 'Non-existent product ID', productId: '999999', expectStatus: 200, expectEmpty: true }, // wait, what happens if ID doesn't exist?
    { desc: 'Non-existent product slug', productId: 'non-existent-product-slug-xyz', expectStatus: 404 },
  ];

  for (const tc of testCases) {
    if (!tc.productId) continue;
    const req = { params: { productId: tc.productId } };
    const res = mockRes();

    await listProductReviews(req, res);

    const status = res.statusCode;
    const data = res.body;

    console.log(`\n[${tc.desc}] (${tc.productId}) -> HTTP ${status}`);

    if (tc.expectStatus && status !== tc.expectStatus) {
      failures.push(`${tc.desc}: Expected HTTP ${tc.expectStatus}, got ${status}`);
      continue;
    }

    if (status === 404) {
      console.log('Got 404 as expected for non-existent slug:', data);
      continue;
    }

    console.log(`Summary: total=${data.total}, average=${data.average}, itemsLength=${data.items?.length}`);
    console.log('Distribution:', data.distribution);

    // 1. Verify items is an array
    if (!Array.isArray(data.items)) {
      failures.push(`${tc.desc}: data.items is not an array!`);
    } else if (tc.expectReviews && data.items.length === 0) {
      failures.push(`${tc.desc}: Expected reviews in items array, but got 0!`);
    } else if (!tc.expectReviews && data.items.length !== 0) {
      failures.push(`${tc.desc}: Expected 0 reviews, but got ${data.items.length}!`);
    }

    // 2. Verify distribution is an array of 5 elements
    if (!Array.isArray(data.distribution) || data.distribution.length !== 5) {
      failures.push(`${tc.desc}: distribution is not an array of 5 elements (got ${data.distribution?.length})`);
    } else {
      const starsPresent = data.distribution.map(d => d.stars).sort((a, b) => a - b);
      if (JSON.stringify(starsPresent) !== JSON.stringify([1, 2, 3, 4, 5])) {
        failures.push(`${tc.desc}: distribution stars do not contain 1 to 5 (got ${starsPresent})`);
      }

      for (const d of data.distribution) {
        if (typeof d.stars !== 'number' || typeof d.count !== 'number' || typeof d.percentage !== 'number') {
          failures.push(`${tc.desc}: Invalid types in distribution item: ${JSON.stringify(d)}`);
        }
        if (Number.isNaN(d.percentage) || Number.isNaN(d.count)) {
          failures.push(`${tc.desc}: NaN found in distribution item: ${JSON.stringify(d)}`);
        }
      }
    }

    // 3. Verify items camelCase fields
    if (Array.isArray(data.items) && data.items.length > 0) {
      for (const item of data.items) {
        const requiredCamelKeys = ['id', 'productId', 'userId', 'userName', 'rating', 'title', 'comment', 'verified', 'createdAt'];
        for (const key of requiredCamelKeys) {
          if (item[key] === undefined) {
            failures.push(`${tc.desc}: Item is missing required camelCase key: ${key}`);
          }
        }

        if (typeof item.userName !== 'string' || item.userName.length === 0) {
          failures.push(`${tc.desc}: userName is invalid: ${item.userName}`);
        }
        if (typeof item.rating !== 'number' || isNaN(item.rating)) {
          failures.push(`${tc.desc}: rating is invalid: ${item.rating}`);
        }
      }
    }

    // Check for NaN or string "NaN" in root object
    if (Number.isNaN(data.total) || Number.isNaN(data.average)) {
      failures.push(`${tc.desc}: total or average is NaN: total=${data.total}, average=${data.average}`);
    }
  }

  if (failures.length > 0) {
    console.log('\n❌ TEST 3 FAILED with issues:', failures);
    process.exit(1);
  } else {
    console.log('\n✅ TEST 3 PASSED: All product reviews test cases passed!');
    process.exit(0);
  }
}

runReviewTests();
