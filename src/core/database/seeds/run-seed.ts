import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { RolesService } from '@/modules/roles/roles.service';
import { UsersService } from '@/modules/users/users.service';
import { GatesService } from '@/modules/gates/gates.service';
import { Role } from '@/modules/roles/enums/role.enum';
import { GateType } from '@/modules/gates/enums/gate-type.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const rolesService = app.get(RolesService);
  const usersService = app.get(UsersService);
  const gatesService = app.get(GatesService);

  console.log('🌱 Running database seeds...');

  // Create default roles
  console.log('Creating default roles...');
  await rolesService.createDefaultRoles();
  console.log('✅ Default roles created');

  // Create default gates
  console.log('Creating default gates...');
  const defaultGates = [
    {
      code: 'EG-01',
      name: 'Entry Gate 1',
      type: GateType.ENTRY,
      description: 'Main entry gate for container trucks',
    },
    {
      code: 'EG-02',
      name: 'Entry Gate 2',
      type: GateType.ENTRY,
      description: 'Secondary entry gate for container trucks',
    },
    {
      code: 'EG-03',
      name: 'Entry Gate 3',
      type: GateType.ENTRY,
      description: 'Visitor entry gate',
    },
    {
      code: 'XG-01',
      name: 'Exit Gate 1',
      type: GateType.EXIT,
      description: 'Main exit gate for container trucks',
    },
    {
      code: 'XG-02',
      name: 'Exit Gate 2',
      type: GateType.EXIT,
      description: 'Secondary exit gate',
    },
    {
      code: 'XG-03',
      name: 'Exit Gate 3',
      type: GateType.EXIT,
      description: 'Visitor exit gate',
    },
  ];

  const createdGates: { [key: string]: string } = {};
  for (const gateData of defaultGates) {
    const existingGate = await gatesService.findByCode(gateData.code);
    if (!existingGate) {
      const createdGate = await gatesService.create(gateData);
      createdGates[gateData.code] = createdGate.id;
      console.log(`  ✅ Created gate: ${gateData.code}`);
    } else {
      createdGates[gateData.code] = existingGate.id;
      console.log(`  ℹ️ Gate already exists: ${gateData.code}`);
    }
  }
  console.log('✅ Default gates created');

  // Collect all gate IDs for admin/supervisor assignment
  const allGateIds = Object.values(createdGates);
  const entryGateIds = [
    createdGates['EG-01'],
    createdGates['EG-02'],
    createdGates['EG-03'],
  ];

  // Create super admin user
  console.log('Creating super admin user...');
  const adminUsername = 'admin';
  const existingAdmin = await usersService.findByUsername(adminUsername);

  if (!existingAdmin) {
    await usersService.create({
      username: adminUsername,
      email: 'admin@example.com',
      password: 'admin123',
      fullName: 'Super Admin',
      roles: [Role.SUPER_ADMIN],
      manageableGateIds: allGateIds,
    });
    console.log('✅ Super admin created (admin / admin123) with all gates');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Create security officer user for EG-01
  console.log('Creating security officer user for EG-01...');
  const officerUsername = 'officer_eg01';
  const existingOfficer = await usersService.findByUsername(officerUsername);

  if (!existingOfficer) {
    await usersService.create({
      username: officerUsername,
      email: 'officer_eg01@example.com',
      password: 'officer123',
      fullName: 'Security Officer EG01',
      roles: [Role.SECURITY_OFFICER],
      assignedGateId: createdGates['EG-01'],
    });
    console.log('✅ Security officer EG01 created (officer_eg01 / officer123)');
  } else {
    console.log('ℹ️ Security officer EG01 already exists');
  }

  // Create security officer user for XG-01
  console.log('Creating security officer user for XG-01...');
  const officerXgUsername = 'officer_xg01';
  const existingOfficerXg =
    await usersService.findByUsername(officerXgUsername);

  if (!existingOfficerXg) {
    await usersService.create({
      username: officerXgUsername,
      email: 'officer_xg01@example.com',
      password: 'officer123',
      fullName: 'Security Officer XG01',
      roles: [Role.SECURITY_OFFICER],
      assignedGateId: createdGates['XG-01'],
    });
    console.log('✅ Security officer XG01 created (officer_xg01 / officer123)');
  } else {
    console.log('ℹ️ Security officer XG01 already exists');
  }

  // Create supervisor user
  console.log('Creating supervisor user...');
  const supervisorUsername = 'supervisor';
  const existingSupervisor =
    await usersService.findByUsername(supervisorUsername);

  if (!existingSupervisor) {
    await usersService.create({
      username: supervisorUsername,
      email: 'supervisor@example.com',
      password: 'supervisor123',
      fullName: 'Terminal Supervisor',
      roles: [Role.SUPERVISOR],
      manageableGateIds: entryGateIds,
    });
    console.log(
      '✅ Supervisor created (supervisor / supervisor123) with entry gates',
    );
  } else {
    console.log('ℹ️ Supervisor user already exists');
  }

  console.log('🎉 Database seeding completed!');
  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
