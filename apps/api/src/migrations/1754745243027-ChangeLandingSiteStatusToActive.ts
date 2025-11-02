import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeLandingSiteStatusToActive1754745243027 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new active column with default true
        await queryRunner.query(`ALTER TABLE "landing_sites" ADD "active" boolean NOT NULL DEFAULT true`);
        
        // Migrate existing data: set active based on old status
        await queryRunner.query(`UPDATE "landing_sites" SET "active" = CASE WHEN "status" = 'active' THEN true ELSE false END`);
        
        // Drop the old status column
        await queryRunner.query(`ALTER TABLE "landing_sites" DROP COLUMN "status"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back the status column
        await queryRunner.query(`ALTER TABLE "landing_sites" ADD "status" varchar DEFAULT 'active'`);
        
        // Migrate data back: set status based on active field
        await queryRunner.query(`UPDATE "landing_sites" SET "status" = CASE WHEN "active" = true THEN 'active' ELSE 'inactive' END`);
        
        // Drop the active column
        await queryRunner.query(`ALTER TABLE "landing_sites" DROP COLUMN "active"`);
    }

}
