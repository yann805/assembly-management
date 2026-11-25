import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AssembliesModule } from './assemblies/assemblies.module';
import { MembersModule } from './members/members.module';
import { MembershipsModule } from './memberships/memberships.module';
import { CategoriesModule } from './categories/categories.module';
import { ContributionsModule } from './contributions/contributions.module';
import { ReportsModule } from './reports/reports.module';
import { ConfirmationsModule } from './confirmations/confirmations.module';
import { StatisticsModule } from './statistics/statistics.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    AssembliesModule,
    MembersModule,
    MembershipsModule,
    CategoriesModule,
    ContributionsModule,
    ReportsModule,
    ConfirmationsModule,
    StatisticsModule,
    AuditModule,
  ],
})
export class AppModule {}
