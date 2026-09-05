import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGateCodeBack1782382000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the `code` column only if it is not already present.
    await queryRunner.query(
      `SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'gates' AND column_name = 'code')`,
    );
    await queryRunner.query(
      `SET @sql = IF(@col_exists = 0, 'ALTER TABLE \`gates\` ADD COLUMN \`code\` varchar(255) NULL', 'SELECT 1')`,
    );
    await queryRunner.query(`PREPARE stmt FROM @sql`);
    await queryRunner.query(`EXECUTE stmt`);
    await queryRunner.query(`DEALLOCATE PREPARE stmt`);

    // Backfill any NULL or empty-string codes with unique generated values so the
    // unique index can be created (existing rows may have migrated as '').
    await queryRunner.query(
      `UPDATE \`gates\` SET \`code\` = CONCAT('G-', REPLACE(UUID(), '-', ''), '-', LEFT(HEX(RAND() * 0xffffffff), 8)) WHERE \`code\` IS NULL OR \`code\` = ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gates\` MODIFY COLUMN \`code\` varchar(255) NOT NULL`,
    );

    // Create the unique index only if it does not already exist.
    await queryRunner.query(
      `SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'gates' AND index_name = 'IDX_gates_code')`,
    );
    await queryRunner.query(
      `SET @sql = IF(@idx_exists = 0, 'CREATE UNIQUE INDEX \`IDX_gates_code\` ON \`gates\` (\`code\`)', 'SELECT 1')`,
    );
    await queryRunner.query(`PREPARE stmt FROM @sql`);
    await queryRunner.query(`EXECUTE stmt`);
    await queryRunner.query(`DEALLOCATE PREPARE stmt`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_gates_code\` ON \`gates\``);
    await queryRunner.query(`ALTER TABLE \`gates\` DROP COLUMN \`code\``);
  }
}
