const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'create_hypercharge_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('Running migration...');
        await db.query(sql);
        console.log('✅ Migration completed successfully!');

        // 테이블 확인
        const result = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name = 'user_hypercharges'
        `);

        if (result.rows.length > 0) {
            console.log('✅ Table "user_hypercharges" created successfully!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
