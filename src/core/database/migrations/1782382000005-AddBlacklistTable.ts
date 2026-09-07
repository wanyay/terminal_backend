import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlacklistTable1782382000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`blacklist\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        \`created_by\` varchar(255) NULL,
        \`updated_by\` varchar(255) NULL,
        \`deleted_by\` varchar(255) NULL,
        \`type\` varchar(255) NOT NULL,
        \`value\` varchar(255) NOT NULL,
        \`reason\` text NULL,
        \`blocked_by\` varchar(255) NULL,
        \`blocked_at\` datetime(6) NOT NULL,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`blacklist\``);
  }
}
