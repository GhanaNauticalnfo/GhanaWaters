import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMinorVersionToSyncLog1755414059606 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add minor_version column with default value
        await queryRunner.query(`
            ALTER TABLE "sync_log" 
            ADD COLUMN "minor_version" integer
        `);

        // Step 2: Assign minor_version sequentially within each major_version group
        // Order by created_at and id to maintain chronological order
        await queryRunner.query(`
            WITH numbered_rows AS (
                SELECT 
                    id,
                    major_version,
                    ROW_NUMBER() OVER (
                        PARTITION BY major_version 
                        ORDER BY created_at ASC, id ASC
                    ) as minor_version
                FROM sync_log
            )
            UPDATE sync_log 
            SET minor_version = numbered_rows.minor_version
            FROM numbered_rows 
            WHERE sync_log.id = numbered_rows.id
        `);

        // Step 3: Make minor_version NOT NULL
        await queryRunner.query(`
            ALTER TABLE "sync_log" 
            ALTER COLUMN "minor_version" SET NOT NULL
        `);

        // Step 4: Drop existing primary key constraint
        await queryRunner.query(`
            ALTER TABLE "sync_log" 
            DROP CONSTRAINT "PK_sync_log"
        `);

        // Step 5: Drop the old id column (auto-generated primary key)
        await queryRunner.query(`
            ALTER TABLE "sync_log" 
            DROP COLUMN "id"
        `);

        // Step 6: Create new composite primary key
        await queryRunner.query(`
            ALTER TABLE "sync_log" 
            ADD CONSTRAINT "PK_sync_log" 
            PRIMARY KEY ("major_version", "minor_version")
        `);

        // Step 7: Update indexes - remove the old entity-based index and update others
        await queryRunner.query(`
            DROP INDEX "IDX_sync_log_entity"
        `);

        // Update the version index to use the new composite key structure
        await queryRunner.query(`
            DROP INDEX "IDX_sync_log_version"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_sync_log_version" 
            ON "sync_log" ("major_version", "minor_version", "created_at", "is_latest") 
            WHERE "is_latest" = true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Drop composite primary key
        await queryRunner.query(`
            ALTER TABLE "sync_log" 
            DROP CONSTRAINT "PK_sync_log"
        `);

        // Step 2: Add back auto-generated id column
        await queryRunner.query(`
            ALTER TABLE "sync_log" 
            ADD COLUMN "id" SERIAL
        `);

        // Step 3: Create primary key on id
        await queryRunner.query(`
            ALTER TABLE "sync_log" 
            ADD CONSTRAINT "PK_sync_log" 
            PRIMARY KEY ("id")
        `);

        // Step 4: Drop minor_version column
        await queryRunner.query(`
            ALTER TABLE "sync_log" 
            DROP COLUMN "minor_version"
        `);

        // Step 5: Restore original indexes
        await queryRunner.query(`
            DROP INDEX "IDX_sync_log_version"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_sync_log_entity" 
            ON "sync_log" ("entity_id", "entity_type", "is_latest")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_sync_log_version" 
            ON "sync_log" ("major_version", "created_at", "is_latest") 
            WHERE "is_latest" = true
        `);
    }

}
