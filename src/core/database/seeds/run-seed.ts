import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { RolesService } from '@/modules/roles/roles.service';
import { UsersService } from '@/modules/users/users.service';
import { GatesService } from '@/modules/gates/gates.service';
import { BlacklistService } from '@/modules/blacklist/blacklist.service';
import { TrucksService } from '@/modules/trucks/trucks.service';
import { VehiclesService } from '@/modules/vehicles/vehicles.service';
import { VisitorsService } from '@/modules/visitors/visitors.service';
import { Role } from '@/modules/roles/enums/role.enum';
import { GateType } from '@/modules/gates/enums/gate-type.enum';
import { BlacklistType } from '@/modules/blacklist/enums/blacklist-type.enum';
import { TruckStatus } from '@/modules/trucks/enums/truck-status.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const rolesService = app.get(RolesService);
  const usersService = app.get(UsersService);
  const gatesService = app.get(GatesService);
  const blacklistService = app.get(BlacklistService);
  const trucksService = app.get(TrucksService);
  const vehiclesService = app.get(VehiclesService);
  const visitorsService = app.get(VisitorsService);

  console.log('🌱 Running database seeds...');

  // Create default roles
  console.log('Creating default roles...');
  await rolesService.createDefaultRoles();
  console.log('✅ Default roles created');

  // Create default gates
  console.log('Creating default gates...');
  const defaultGateNames = [
    {
      name: 'Entry Gate 1',
      type: GateType.ENTRY,
      description: 'Main entry gate for container trucks',
    },
    {
      name: 'Entry Gate 2',
      type: GateType.ENTRY,
      description: 'Secondary entry gate for container trucks',
    },
    {
      name: 'Entry Gate 3',
      type: GateType.ENTRY,
      description: 'Visitor entry gate',
    },
    {
      name: 'Exit Gate 1',
      type: GateType.EXIT,
      description: 'Main exit gate for container trucks',
    },
    {
      name: 'Exit Gate 2',
      type: GateType.EXIT,
      description: 'Secondary exit gate',
    },
    {
      name: 'Exit Gate 3',
      type: GateType.EXIT,
      description: 'Visitor exit gate',
    },
  ];

  const createdGates: { [key: string]: string } = {};
  for (const gateData of defaultGateNames) {
    const existingGate = await gatesService.findByName(gateData.name);
    if (!existingGate) {
      const createdGate = await gatesService.create(gateData);
      createdGates[gateData.name] = createdGate.id;
      console.log(`  ✅ Created gate: ${gateData.name}`);
    } else {
      createdGates[gateData.name] = existingGate.id;
      console.log(`  ℹ️ Gate already exists: ${gateData.name}`);
    }
  }
  console.log('✅ Default gates created');

  // Collect all gate IDs for admin/supervisor assignment
  const allGateIds = Object.values(createdGates);
  const entryGateIds = [
    createdGates['Entry Gate 1'],
    createdGates['Entry Gate 2'],
    createdGates['Entry Gate 3'],
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

  // Create security officer user for Entry Gate 1
  console.log('Creating security officer user for Entry Gate 1...');
  const officerUsername = 'officer_eg01';
  const existingOfficer = await usersService.findByUsername(officerUsername);

  if (!existingOfficer) {
    await usersService.create({
      username: officerUsername,
      email: 'officer_eg01@example.com',
      password: 'officer123',
      fullName: 'Security Officer EG01',
      roles: [Role.SECURITY_OFFICER],
      assignedGateId: createdGates['Entry Gate 1'],
    });
    console.log('✅ Security officer EG01 created (officer_eg01 / officer123)');
  } else {
    console.log('ℹ️ Security officer EG01 already exists');
  }

  // Create security officer user for Exit Gate 1
  console.log('Creating security officer user for Exit Gate 1...');
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
      assignedGateId: createdGates['Exit Gate 1'],
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

  // Create sample blacklist entries
  console.log('Creating sample blacklist entries...');
  const blacklistEntries = [
    {
      type: BlacklistType.LICENSE_PLATE,
      value: 'YGN/EE-9999',
      reason: 'Stolen vehicle',
      blockedBy: 'admin',
    },
    {
      type: BlacklistType.LICENSE_PLATE,
      value: 'MDY/AA-8888',
      reason: 'Unauthorized access attempt',
      blockedBy: 'admin',
    },
    {
      type: BlacklistType.NRC_PASSPORT,
      value: '12/ABC(N)999999',
      reason: 'Previous security violation',
      blockedBy: 'admin',
    },
  ];

  for (const entry of blacklistEntries) {
    try {
      await blacklistService.create(entry);
      console.log(`  ✅ Blacklisted: ${entry.type} - ${entry.value}`);
    } catch (error) {
      console.log(`  ℹ️ Blacklist entry already exists: ${entry.value}`);
    }
  }

  // Create sample container trucks
  console.log('Creating sample container trucks...');
  const sampleTrucks = [
    {
      licensePlate: 'YGN/EE-1234',
      containerNumber: 'CNTR-001234',
      driverName: 'Aung Aung',
      driverNrc: '12/ABC(N)123456',
      entryGateId: createdGates['Entry Gate 1'],
      status: TruckStatus.ENTERED,
      entryTime: new Date(),
    },
    {
      licensePlate: 'MDY/BB-5678',
      containerNumber: 'CNTR-005678',
      driverName: 'Kyaw Kyaw',
      driverNrc: '9/DEF(N)654321',
      entryGateId: createdGates['Entry Gate 2'],
      exitGateId: createdGates['Exit Gate 1'],
      status: TruckStatus.EXITED,
      entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      exitTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      licensePlate: 'NPT/CC-9012',
      containerNumber: 'CNTR-009012',
      driverName: 'Tun Tun',
      driverNrc: '3/GHI(N)789012',
      entryGateId: createdGates['Entry Gate 3'],
      status: TruckStatus.ENTERED,
      entryTime: new Date(Date.now() - 30 * 60 * 1000),
    },
  ];

  for (const truckData of sampleTrucks) {
    try {
      await trucksService.create(truckData);
      console.log(`  ✅ Truck created: ${truckData.licensePlate}`);
    } catch (error) {
      console.log(`  ℹ️ Truck already exists: ${truckData.licensePlate}`);
    }
  }

  // Create sample visiting vehicles
  console.log('Creating sample visiting vehicles...');
  const sampleVehicles = [
    {
      plateNumber: 'YGN/KA-3456',
      vehicleType: 'Sedan',
      vehicleModel: 'Toyota Camry',
      visitorName: 'John Smith',
      nrcOrLicense: '12/ABC(N)345678',
      companyName: 'ABC Logistics',
      purposeOfVisit: 'Business meeting',
      entryGateId: createdGates['Entry Gate 3'],
      status: TruckStatus.ENTERED,
      entryTime: new Date(),
    },
    {
      plateNumber: 'MDY/KB-7890',
      vehicleType: 'SUV',
      vehicleModel: 'Honda CR-V',
      visitorName: 'Jane Doe',
      nrcOrLicense: '9/DEF(N)456789',
      companyName: 'XYZ Trading',
      purposeOfVisit: 'Site inspection',
      entryGateId: createdGates['Entry Gate 3'],
      exitGateId: createdGates['Exit Gate 3'],
      status: TruckStatus.EXITED,
      entryTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      exitTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ];

  for (const vehicleData of sampleVehicles) {
    try {
      await vehiclesService.create(vehicleData);
      console.log(`  ✅ Vehicle created: ${vehicleData.plateNumber}`);
    } catch (error) {
      console.log(`  ℹ️ Vehicle already exists: ${vehicleData.plateNumber}`);
    }
  }

  // Create sample visitors
  console.log('Creating sample visitors...');
  const sampleVisitors = [
    {
      visitorName: 'Michael Johnson',
      nrcOrPassport: '12/ABC(N)111222',
      phoneNumber: '+959123456789',
      companyName: 'Global Shipping',
      purposeOfVisit: 'Cargo inspection',
      hostEmployee: 'Mr. Manager',
      entryGateId: createdGates['Entry Gate 3'],
      status: TruckStatus.ENTERED,
      entryTime: new Date(),
    },
    {
      visitorName: 'Sarah Williams',
      nrcOrPassport: '9/DEF(N)333444',
      phoneNumber: '+959987654321',
      companyName: 'Port Authority',
      purposeOfVisit: 'Audit visit',
      hostEmployee: 'Ms. Director',
      entryGateId: createdGates['Entry Gate 3'],
      exitGateId: createdGates['Exit Gate 3'],
      status: TruckStatus.EXITED,
      entryTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      exitTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ];

  for (const visitorData of sampleVisitors) {
    try {
      await visitorsService.create(visitorData);
      console.log(`  ✅ Visitor created: ${visitorData.visitorName}`);
    } catch (error) {
      console.log(`  ℹ️ Visitor already exists: ${visitorData.visitorName}`);
    }
  }

  console.log('🎉 Database seeding completed!');
  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
