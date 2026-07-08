import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropGateCodeColumn1782382000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gates\` DROP INDEX \`IDX_fc8604337a2432c687a0f1a7e31\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`gates\` DROP COLUMN \`code\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gates\` ADD COLUMN \`code\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_fc8604337a2432c687a0f1a7e31\` ON \`gates\` (\`code\`)`,
    );
  }
}
