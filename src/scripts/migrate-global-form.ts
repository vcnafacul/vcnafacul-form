/**
 * Migration: Set ownerType=GLOBAL and ownerId=null on all existing forms.
 *
 * Usage:
 *   MONGODB=<connection-string> npx ts-node src/scripts/migrate-global-form.ts
 *
 * Idempotent — only updates documents missing the ownerType field.
 */
import { MongoClient } from 'mongodb';

async function run() {
  const uri = process.env.MONGODB ?? 'mongodb://localhost:27017/forms';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    // 1. Migrate forms
    const formsResult = await db.collection('forms').updateMany(
      { ownerType: { $exists: false } },
      { $set: { ownerType: 'GLOBAL', ownerId: null } },
    );
    console.log(
      `[forms] matched=${formsResult.matchedCount} modified=${formsResult.modifiedCount}`,
    );

    // 2. Drop Section name_1 unique index (if it exists)
    try {
      await db.collection('sections').dropIndex('name_1');
      console.log('[sections] dropped index name_1');
    } catch (err: any) {
      if (err.codeName === 'IndexNotFound') {
        console.log('[sections] index name_1 not found — skipping');
      } else {
        throw err;
      }
    }

    // 3. Drop Form name_1 unique index (if it exists)
    try {
      await db.collection('forms').dropIndex('name_1');
      console.log('[forms] dropped index name_1');
    } catch (err: any) {
      if (err.codeName === 'IndexNotFound') {
        console.log('[forms] index name_1 not found — skipping');
      } else {
        throw err;
      }
    }

    console.log('Migration complete.');
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
