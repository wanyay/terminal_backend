import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserManageableGates1782382000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`user_manageable_gates\` (
        \`user_id\` varchar(36) NOT NULL,
        \`gate_id\` varchar(36) NOT NULL,
        INDEX \`IDX_umg_user_id\` (\`user_id\`),
        INDEX \`IDX_umg_gate_id\` (\`gate_id\`),
        PRIMARY KEY (\`user_id\`, \`gate_id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_manageable_gates\`
        ADD CONSTRAINT \`FK_umg_user_id\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_manageable_gates\`
        ADD CONSTRAINT \`FK_umg_gate_id\`
        FOREIGN KEY (\`gate_id\`) REFERENCES \`gates\`(\`id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_manageable_gates\` DROP FOREIGN KEY \`FK_umg_gate_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_manageable_gates\` DROP FOREIGN KEY \`FK_umg_user_id\``,
    );
    await queryRunner.query(`DROP TABLE \`user_manageable_gates\``);
  }
}
