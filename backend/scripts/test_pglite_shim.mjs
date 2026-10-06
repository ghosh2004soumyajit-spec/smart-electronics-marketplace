import { query } from '../config/db.js';

async function runTests() {
  console.log('=== TEST 1: PGlite query shim across multiple scenarios ===');
  let failures = [];

  try {
    // Setup a temporary table for testing
    await query(`
      CREATE TEMP TABLE test_shim_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50),
        val INT
      )
    `);

    // 1. INSERT 1 row
    const insertRes1 = await query("INSERT INTO test_shim_items (name, val) VALUES ('item1', 10)");
    console.log('1. INSERT 1 row:', { rowCount: insertRes1.rowCount, affectedRows: insertRes1.affectedRows });
    if (insertRes1.rowCount !== 1) {
      failures.push(`INSERT 1 row expected rowCount: 1, got: ${insertRes1.rowCount}`);
    }

    // 2. INSERT 2 rows
    const insertRes2 = await query("INSERT INTO test_shim_items (name, val) VALUES ('item2', 20), ('item3', 20)");
    console.log('2. INSERT 2 rows:', { rowCount: insertRes2.rowCount, affectedRows: insertRes2.affectedRows });
    if (insertRes2.rowCount !== 2) {
      failures.push(`INSERT 2 rows expected rowCount: 2, got: ${insertRes2.rowCount}`);
    }

    // 3. SELECT multiple rows
    const selectRes1 = await query("SELECT * FROM test_shim_items");
    console.log('3. SELECT all rows (3 items):', { rowCount: selectRes1.rowCount, rowsCount: selectRes1.rows.length });
    if (selectRes1.rowCount !== 3) {
      failures.push(`SELECT 3 rows expected rowCount: 3, got: ${selectRes1.rowCount}`);
    }

    // 4. SELECT 0 rows
    const selectRes0 = await query("SELECT * FROM test_shim_items WHERE 1=0");
    console.log('4. SELECT 0 rows:', { rowCount: selectRes0.rowCount, rowsCount: selectRes0.rows.length });
    if (selectRes0.rowCount !== 0) {
      failures.push(`SELECT 0 rows expected rowCount: 0, got: ${selectRes0.rowCount}`);
    }

    // 5. UPDATE 0 rows
    const updateRes0 = await query("UPDATE test_shim_items SET val = 999 WHERE name = 'nonexistent'");
    console.log('5. UPDATE 0 rows:', { rowCount: updateRes0.rowCount, affectedRows: updateRes0.affectedRows });
    if (updateRes0.rowCount !== 0) {
      failures.push(`UPDATE 0 rows expected rowCount: 0, got: ${updateRes0.rowCount}`);
    }

    // 6. UPDATE N rows (2 rows where val = 20)
    const updateResN = await query("UPDATE test_shim_items SET val = 30 WHERE val = 20");
    console.log('6. UPDATE N rows (2 rows):', { rowCount: updateResN.rowCount, affectedRows: updateResN.affectedRows });
    if (updateResN.rowCount !== 2) {
      failures.push(`UPDATE 2 rows expected rowCount: 2, got: ${updateResN.rowCount}`);
    }

    // 7. UPDATE 1 row
    const updateRes1 = await query("UPDATE test_shim_items SET val = 50 WHERE name = 'item1'");
    console.log('7. UPDATE 1 row:', { rowCount: updateRes1.rowCount, affectedRows: updateRes1.affectedRows });
    if (updateRes1.rowCount !== 1) {
      failures.push(`UPDATE 1 row expected rowCount: 1, got: ${updateRes1.rowCount}`);
    }

    // 8. DELETE 0 rows
    const deleteRes0 = await query("DELETE FROM test_shim_items WHERE name = 'nonexistent'");
    console.log('8. DELETE 0 rows:', { rowCount: deleteRes0.rowCount, affectedRows: deleteRes0.affectedRows });
    if (deleteRes0.rowCount !== 0) {
      failures.push(`DELETE 0 rows expected rowCount: 0, got: ${deleteRes0.rowCount}`);
    }

    // 9. DELETE N rows (2 rows where val = 30)
    const deleteResN = await query("DELETE FROM test_shim_items WHERE val = 30");
    console.log('9. DELETE N rows (2 rows):', { rowCount: deleteResN.rowCount, affectedRows: deleteResN.affectedRows });
    if (deleteResN.rowCount !== 2) {
      failures.push(`DELETE 2 rows expected rowCount: 2, got: ${deleteResN.rowCount}`);
    }

    // 10. DELETE 1 remaining row
    const deleteRes1 = await query("DELETE FROM test_shim_items WHERE name = 'item1'");
    console.log('10. DELETE 1 row:', { rowCount: deleteRes1.rowCount, affectedRows: deleteRes1.affectedRows });
    if (deleteRes1.rowCount !== 1) {
      failures.push(`DELETE 1 row expected rowCount: 1, got: ${deleteRes1.rowCount}`);
    }

    // 11. UPDATE with RETURNING *
    await query("INSERT INTO test_shim_items (name, val) VALUES ('ret1', 100), ('ret2', 100)");
    const updateRet = await query("UPDATE test_shim_items SET val = 200 WHERE val = 100 RETURNING *");
    console.log('11. UPDATE with RETURNING * (2 rows):', { rowCount: updateRet.rowCount, rowsCount: updateRet.rows.length });
    if (updateRet.rowCount !== 2) {
      failures.push(`UPDATE RETURNING expected rowCount: 2, got: ${updateRet.rowCount}`);
    }

    // 12. DELETE with RETURNING *
    const deleteRet = await query("DELETE FROM test_shim_items WHERE val = 200 RETURNING *");
    console.log('12. DELETE with RETURNING * (2 rows):', { rowCount: deleteRet.rowCount, rowsCount: deleteRet.rows.length });
    if (deleteRet.rowCount !== 2) {
      failures.push(`DELETE RETURNING expected rowCount: 2, got: ${deleteRet.rowCount}`);
    }

    // Clean up
    await query("DROP TABLE test_shim_items");

  } catch (err) {
    console.error('Test execution error:', err);
    failures.push(`Exception occurred: ${err.message}`);
  }

  if (failures.length > 0) {
    console.log('\n❌ TEST 1 FAILED with issues:', failures);
    process.exit(1);
  } else {
    console.log('\n✅ TEST 1 PASSED: All PGlite query shim scenarios verified accurate!');
    process.exit(0);
  }
}

runTests();
