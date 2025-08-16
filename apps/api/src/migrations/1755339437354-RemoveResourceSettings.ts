import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveResourceSettings1755339437354 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_resource_settings_resource"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_setting_types_resource_type"`);
        
        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "resource_settings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "setting_types"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate setting_types table
        await queryRunner.query(`
            CREATE TABLE "setting_types" (
                "id" SERIAL NOT NULL,
                "resource_type" character varying(255) NOT NULL,
                "setting_key" character varying(255) NOT NULL,
                "display_name" character varying(255) NOT NULL,
                "data_type" character varying(255) NOT NULL DEFAULT 'string',
                "is_required" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_setting_types" UNIQUE ("resource_type", "setting_key"),
                CONSTRAINT "PK_setting_types" PRIMARY KEY ("id")
            )
        `);

        // Recreate resource_settings table  
        await queryRunner.query(`
            CREATE TABLE "resource_settings" (
                "id" SERIAL NOT NULL,
                "resource_type" character varying(255) NOT NULL,
                "resource_id" integer NOT NULL,
                "setting_key" character varying(255) NOT NULL,
                "value" text NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_resource_settings" UNIQUE ("resource_type", "resource_id", "setting_key"),
                CONSTRAINT "PK_resource_settings" PRIMARY KEY ("id")
            )
        `);

        // Recreate indexes
        await queryRunner.query(`CREATE INDEX "IDX_resource_settings_resource" ON "resource_settings" ("resource_type", "resource_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_setting_types_resource_type" ON "setting_types" ("resource_type")`);
        
        // Recreate initial data
        await queryRunner.query(`
            INSERT INTO "setting_types" ("resource_type", "setting_key", "display_name", "data_type", "is_required") 
            VALUES 
                ('vessel', '1', 'Phone Number', 'string', false),
                ('vessel', '2', 'Email', 'string', false),
                ('vessel_type', 'color', 'Color', 'string', false),
                ('vessel_type', 'visibility', 'Visibility', 'boolean', false),
                ('route', 'color', 'Color', 'string', false),
                ('route', 'visibility', 'Visibility', 'boolean', false),
                ('landing_site', 'color', 'Color', 'string', false),
                ('landing_site', 'visibility', 'Visibility', 'boolean', false)
        `);
    }

}
