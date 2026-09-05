import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogIndexes1782382000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_audit_logs_created_at\` ON \`audit_logs\` (\`created_at\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_audit_logs_module\` ON \`audit_logs\` (\`module\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_audit_logs_username\` ON \`audit_logs\` (\`username\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_audit_logs_user_id\` ON \`audit_logs\` (\`user_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_audit_logs_action\` ON \`audit_logs\` (\`action\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_audit_logs_created_at_module\` ON \`audit_logs\` (\`created_at\`, \`module\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_audit_logs_created_at_module\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_audit_logs_action\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_audit_logs_user_id\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_audit_logs_username\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_audit_logs_module\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_audit_logs_created_at\` ON \`audit_logs\``,
    );
  }
}
