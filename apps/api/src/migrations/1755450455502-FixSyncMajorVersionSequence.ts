import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSyncMajorVersionSequence1755450455502 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Set the default value for the id column to use the sequence
        await queryRunner.query(`
            ALTER TABLE sync_major_version 
            ALTER COLUMN id SET DEFAULT nextval('sync_major_version_id_seq')
        `);

        // Fix the sequence value to be correct (next value based on max existing ID)
        await queryRunner.query(`
            SELECT setval('sync_major_version_id_seq', 
                (SELECT COALESCE(MAX(id), 0) FROM sync_major_version), true)
        `);

        // Set sequence ownership so it's properly managed
        await queryRunner.query(`
            ALTER SEQUENCE sync_major_version_id_seq 
            OWNED BY sync_major_version.id
        `);

        // Drop the old orphaned sequence from the rename
        await queryRunner.query(`
            DROP SEQUENCE IF EXISTS sync_version_id_seq
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the old sequence if it doesn't exist
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS sync_version_id_seq
        `);

        // Remove the default value from the id column
        await queryRunner.query(`
            ALTER TABLE sync_major_version 
            ALTER COLUMN id DROP DEFAULT
        `);

        // Remove sequence ownership
        await queryRunner.query(`
            ALTER SEQUENCE sync_major_version_id_seq 
            OWNED BY NONE
        `);
    }

}
