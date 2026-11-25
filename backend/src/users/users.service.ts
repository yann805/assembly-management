import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, ResetCredentialsDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        roleAssignments: { include: { role: true, assembly: true } },
        member: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        roleAssignments: { include: { role: true, assembly: true } },
        member: true,
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return user;
  }

  async create(dto: CreateUserDto, createdBy: string) {
    // Vérifications d'unicité
    if (dto.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new BadRequestException('Cet email est déjà utilisé.');
    }
    if (dto.phone) {
      const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (exists) throw new BadRequestException('Ce téléphone est déjà utilisé.');
    }

    // Mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const hash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        memberId: dto.memberId || undefined,
        passwordHash: hash,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        member: true,
      },
    });

    return {
      ...user,
      temporaryPassword: tempPassword,
    };
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
    return this.findOne(id);
  }

  async resetCredentials(id: string, dto: ResetCredentialsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    const passwordHash = dto.newPassword ? await bcrypt.hash(dto.newPassword, 10) : undefined;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(passwordHash ? { passwordHash } : {}),
        isActive: dto.isActive ?? user.isActive,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        roleAssignments: { include: { role: true, assembly: true } },
        member: true,
      },
    });
  }
}
