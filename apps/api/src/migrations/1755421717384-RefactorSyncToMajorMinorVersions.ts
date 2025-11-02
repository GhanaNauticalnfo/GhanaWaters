import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorSyncToMajorMinorVersions1755421717384 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename sync_version table to sync_major_version
        await queryRunner.query(`ALTER TABLE "sync_version" RENAME TO "sync_major_version"`);
        
        // Create new sync_minor_version table
        await queryRunner.query(`
            CREATE TABLE "sync_minor_version" (
                "major_version" integer NOT NULL,
                "minor_version" integer NOT NULL,
                "data" jsonb NOT NULL,
                "size" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_sync_minor_version" PRIMARY KEY ("major_version", "minor_version")
            )
        `);
        
        // Create indexes on sync_minor_version
        await queryRunner.query(`CREATE INDEX "IDX_sync_minor_version_created_at" ON "sync_minor_version" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_sync_minor_version_major_minor_created" ON "sync_minor_version" ("major_version", "minor_version", "created_at")`);
        
        // Migrate data from sync_log to sync_minor_version
        await queryRunner.query(`
            INSERT INTO "sync_minor_version" ("major_version", "minor_version", "data", "size", "created_at")
            SELECT 
                "major_version",
                "minor_version",
                JSON_BUILD_ARRAY(
                    JSON_BUILD_OBJECT(
                        'entityType', "entity_type",
                        'entityId', "entity_id",
                        'entityAction', "action",
                        'entityData', "data"
                    )
                ),
                COALESCE(LENGTH("data"::text), 0),
                "created_at"
            FROM "sync_log"
            ORDER BY "major_version", "minor_version"
        `);
        
        // Drop the old sync_log table
        await queryRunner.query(`DROP TABLE "sync_log"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Create sync_log table
        await queryRunner.query(`
            CREATE TABLE "sync_log" (
                "major_version" integer NOT NULL,
                "minor_version" integer NOT NULL,
                "entity_type" character varying(50) NOT NULL,
                "entity_id" character varying(100) NOT NULL,
                "action" character varying(20) NOT NULL,
                "data" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "is_latest" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_sync_log" PRIMARY KEY ("major_version", "minor_version")
            )
        `);
        
        // Create indexes on sync_log
        await queryRunner.query(`CREATE INDEX "IDX_sync_log_created_at_is_latest" ON "sync_log" ("created_at", "is_latest") WHERE "is_latest" = true`);
        await queryRunner.query(`CREATE INDEX "IDX_sync_log_major_minor_created_is_latest" ON "sync_log" ("major_version", "minor_version", "created_at", "is_latest") WHERE "is_latest" = true`);
        
        // Migrate data back from sync_minor_version to sync_log (flatten the JSON array)
        await queryRunner.query(`
            INSERT INTO "sync_log" ("major_version", "minor_version", "entity_type", "entity_id", "action", "data", "created_at", "is_latest")
            SELECT 
                "major_version",
                "minor_version",
                (jsonb_array_elements("data")->>'entityType'),
                (jsonb_array_elements("data")->>'entityId'),
                (jsonb_array_elements("data")->>'entityAction'),
                (jsonb_array_elements("data")->'entityData'),
                "created_at",
                true
            FROM "sync_minor_version"
            ORDER BY "major_version", "minor_version"
        `);
        
        // Drop sync_minor_version table
        await queryRunner.query(`DROP TABLE "sync_minor_version"`);
        
        // Rename sync_major_version back to sync_version
        await queryRunner.query(`ALTER TABLE "sync_major_version" RENAME TO "sync_version"`);
    }

}
