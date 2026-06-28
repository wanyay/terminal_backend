import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1782382000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE \`roles\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        \`created_by\` varchar(255) NULL,
        \`updated_by\` varchar(255) NULL,
        \`deleted_by\` varchar(255) NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` varchar(255) NULL,
        UNIQUE INDEX \`IDX_648e35c7a3e0917a460851856b5\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE \`permissions\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        \`created_by\` varchar(255) NULL,
        \`updated_by\` varchar(255) NULL,
        \`deleted_by\` varchar(255) NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` varchar(255) NULL,
        UNIQUE INDEX \`IDX_48cce05aa6ca55c369d702b843a\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create users table
  await queryRunner.query(`
    CREATE TABLE \`users\` (
      \`id\` varchar(36) NOT NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`deleted_at\` datetime(6) NULL,
      \`created_by\` varchar(255) NULL,
      \`updated_by\` varchar(255) NULL,
      \`deleted_by\` varchar(255) NULL,
      \`username\` varchar(255) NOT NULL,
      \`email\` varchar(255) NULL,
      \`password\` varchar(255) NOT NULL,
      \`full_name\` varchar(255) NOT NULL,
      \`must_change_password\` tinyint NOT NULL DEFAULT 1,
      \`is_active\` tinyint NOT NULL DEFAULT 1,
      \`refresh_token\` text NULL,
      \`assigned_gate_id\` varchar(36) NULL,
      UNIQUE INDEX \`IDX_fe0bb3f6520ca7c769f7c8897b8\` (\`username\`),
      UNIQUE INDEX \`IDX_97672ac88f789774dd470fbe8c8\` (\`email\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB
  `);

  // Create user_roles join table
  await queryRunner.query(`
    CREATE TABLE \`user_roles\` (
      \`user_id\` varchar(36) NOT NULL,
      \`role_id\` varchar(36) NOT NULL,
      INDEX \`IDX_47de65701748510c550a6043d97\` (\`user_id\`),
      INDEX \`IDX_32911099e4999e6b216f03668e1\` (\`role_id\`),
      PRIMARY KEY (\`user_id\`, \`role_id\`)
    ) ENGINE=InnoDB
  `);

  // Create role_permissions join table
  await queryRunner.query(`
    CREATE TABLE \`role_permissions\` (
      \`role_id\` varchar(36) NOT NULL,
      \`permission_id\` varchar(36) NOT NULL,
      INDEX \`IDX_b36cb2e4a3799e83ca9b2343714\` (\`role_id\`),
      INDEX \`IDX_63896553242188416031420018a\` (\`permission_id\`),
      PRIMARY KEY (\`role_id\`, \`permission_id\`)
    ) ENGINE=InnoDB
  `);

  // Create gates table
  await queryRunner.query(`
    CREATE TABLE \`gates\` (
      \`id\` varchar(36) NOT NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`deleted_at\` datetime(6) NULL,
      \`created_by\` varchar(255) NULL,
      \`updated_by\` varchar(255) NULL,
      \`deleted_by\` varchar(255) NULL,
      \`code\` varchar(255) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`type\` varchar(255) NOT NULL,
      \`description\` varchar(255) NULL,
      \`is_active\` tinyint NOT NULL DEFAULT 1,
      UNIQUE INDEX \`IDX_fc8604337a2432c687a0f1a7e31\` (\`code\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB
  `);

    // Create container_trucks table
    await queryRunner.query(`
      CREATE TABLE \`container_trucks\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        \`created_by\` varchar(255) NULL,
        \`updated_by\` varchar(255) NULL,
        \`deleted_by\` varchar(255) NULL,
        \`license_plate\` varchar(255) NOT NULL,
        \`container_number\` varchar(255) NULL,
        \`driver_name\` varchar(255) NULL,
        \`driver_nrc\` varchar(255) NULL,
        \`entry_gate_id\` varchar(36) NULL,
        \`exit_gate_id\` varchar(36) NULL,
        \`entry_time\` datetime(6) NULL,
        \`exit_time\` datetime(6) NULL,
        \`status\` varchar(255) NOT NULL DEFAULT 'ENTERED',
        \`remarks\` text NULL,
        INDEX \`IDX_481704b5fa9192654b075756a1e\` (\`entry_gate_id\`),
        INDEX \`IDX_b75079578b23b78719a6b27068e\` (\`exit_gate_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create visiting_vehicles table
    await queryRunner.query(`
      CREATE TABLE \`visiting_vehicles\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        \`created_by\` varchar(255) NULL,
        \`updated_by\` varchar(255) NULL,
        \`deleted_by\` varchar(255) NULL,
        \`plate_number\` varchar(255) NOT NULL,
        \`vehicle_type\` varchar(255) NULL,
        \`vehicle_model\` varchar(255) NULL,
        \`visitor_name\` varchar(255) NOT NULL,
        \`nrc_or_license\` varchar(255) NULL,
        \`company_name\` varchar(255) NULL,
        \`purpose_of_visit\` varchar(255) NULL,
        \`entry_gate_id\` varchar(36) NULL,
        \`exit_gate_id\` varchar(36) NULL,
        \`entry_time\` datetime(6) NULL,
        \`exit_time\` datetime(6) NULL,
        \`status\` varchar(255) NOT NULL DEFAULT 'ENTERED',
        \`remarks\` text NULL,
        INDEX \`IDX_2547e077d3569b29f559265823e\` (\`entry_gate_id\`),
        INDEX \`IDX_47eddd549b4b72c08b86b47fa5d\` (\`exit_gate_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create visitors table
    await queryRunner.query(`
      CREATE TABLE \`visitors\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        \`created_by\` varchar(255) NULL,
        \`updated_by\` varchar(255) NULL,
        \`deleted_by\` varchar(255) NULL,
        \`visitor_name\` varchar(255) NOT NULL,
        \`nrc_or_passport\` varchar(255) NULL,
        \`phone_number\` varchar(255) NULL,
        \`company_name\` varchar(255) NULL,
        \`purpose_of_visit\` varchar(255) NULL,
        \`host_employee\` varchar(255) NULL,
        \`entry_gate_id\` varchar(36) NULL,
        \`exit_gate_id\` varchar(36) NULL,
        \`entry_time\` datetime(6) NULL,
        \`exit_time\` datetime(6) NULL,
        \`status\` varchar(255) NOT NULL DEFAULT 'ENTERED',
        \`remarks\` text NULL,
        INDEX \`IDX_2193315024859a2d19055696151\` (\`entry_gate_id\`),
        INDEX \`IDX_0e0e95588c540b5900a49226454\` (\`exit_gate_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE \`audit_logs\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        \`created_by\` varchar(255) NULL,
        \`updated_by\` varchar(255) NULL,
        \`deleted_by\` varchar(255) NULL,
        \`user_id\` varchar(255) NULL,
        \`username\` varchar(255) NULL,
        \`action\` varchar(255) NOT NULL,
        \`module\` varchar(255) NOT NULL,
        \`ip_address\` varchar(255) NULL,
        \`user_agent\` text NULL,
        \`old_values\` text NULL,
        \`new_values\` text NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_47de65701748510c550a6043d97\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_32911099e4999e6b216f03668e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_b36cb2e4a3799e83ca9b2343714\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_63896553242188416031420018a\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\` ADD CONSTRAINT \`FK_users_assigned_gate\` FOREIGN KEY (\`assigned_gate_id\`) REFERENCES \`gates\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`container_trucks\` ADD CONSTRAINT \`FK_481704b5fa9192654b075756a1e\` FOREIGN KEY (\`entry_gate_id\`) REFERENCES \`gates\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`container_trucks\` ADD CONSTRAINT \`FK_b75079578b23b78719a6b27068e\` FOREIGN KEY (\`exit_gate_id\`) REFERENCES \`gates\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`visiting_vehicles\` ADD CONSTRAINT \`FK_2547e077d3569b29f559265823e\` FOREIGN KEY (\`entry_gate_id\`) REFERENCES \`gates\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`visiting_vehicles\` ADD CONSTRAINT \`FK_47eddd549b4b72c08b86b47fa5d\` FOREIGN KEY (\`exit_gate_id\`) REFERENCES \`gates\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`visitors\` ADD CONSTRAINT \`FK_2193315024859a2d19055696151\` FOREIGN KEY (\`entry_gate_id\`) REFERENCES \`gates\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE \`visitors\` ADD CONSTRAINT \`FK_0e0e95588c540b5900a49226454\` FOREIGN KEY (\`exit_gate_id\`) REFERENCES \`gates\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`visitors\` DROP FOREIGN KEY \`FK_0e0e95588c540b5900a49226454\``);
    await queryRunner.query(`ALTER TABLE \`visitors\` DROP FOREIGN KEY \`FK_2193315024859a2d19055696151\``);
    await queryRunner.query(`ALTER TABLE \`visiting_vehicles\` DROP FOREIGN KEY \`FK_47eddd549b4b72c08b86b47fa5d\``);
    await queryRunner.query(`ALTER TABLE \`visiting_vehicles\` DROP FOREIGN KEY \`FK_2547e077d3569b29f559265823e\``);
    await queryRunner.query(`ALTER TABLE \`container_trucks\` DROP FOREIGN KEY \`FK_b75079578b23b78719a6b27068e\``);
    await queryRunner.query(`ALTER TABLE \`container_trucks\` DROP FOREIGN KEY \`FK_481704b5fa9192654b075756a1e\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_users_assigned_gate\``);
    await queryRunner.query(`ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_63896553242188416031420018a\``);
    await queryRunner.query(`ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_b36cb2e4a3799e83ca9b2343714\``);
    await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_32911099e4999e6b216f03668e1\``);
    await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_47de65701748510c550a6043d97\``);
    await queryRunner.query(`DROP TABLE \`audit_logs\``);
    await queryRunner.query(`DROP TABLE \`visitors\``);
    await queryRunner.query(`DROP TABLE \`visiting_vehicles\``);
    await queryRunner.query(`DROP TABLE \`container_trucks\``);
    await queryRunner.query(`DROP TABLE \`gates\``);
    await queryRunner.query(`DROP TABLE \`role_permissions\``);
    await queryRunner.query(`DROP TABLE \`user_roles\``);
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`permissions\``);
    await queryRunner.query(`DROP TABLE \`roles\``);
  }
}
