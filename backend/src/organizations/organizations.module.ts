import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
})
export class OrganizationsModule {}
