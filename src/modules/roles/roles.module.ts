import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolesService } from './roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, PermissionEntity])],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
