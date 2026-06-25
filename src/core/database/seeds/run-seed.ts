import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { RolesService } from '@/modules/roles/roles.service';
import { UsersService } from '@/modules/users/users.service';
import { Role } from '@/modules/roles/enums/role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const rolesService = app.get(RolesService);
  const usersService = app.get(UsersService);

  console.log('🌱 Running database seeds...');

  // Create default roles
  console.log('Creating default roles...');
  await rolesService.createDefaultRoles();
  console.log('✅ Default roles created');

  // Create admin user
  console.log('Creating admin user...');
  const adminUsername = 'admin';
  const existingAdmin = await usersService.findByUsername(adminUsername);

  if (!existingAdmin) {
    await usersService.create({
      username: adminUsername,
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      roles: [Role.ADMIN, Role.USER],
    });
    console.log('✅ Admin user created (admin / admin123)');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  console.log('🎉 Database seeding completed!');
  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
