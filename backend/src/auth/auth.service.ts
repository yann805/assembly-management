import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // Identifier peut être un email ou un téléphone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
      include: {
        roleAssignments: { include: { role: true, assembly: true } },
        member: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Ce compte est désactivé. Contactez l\'administrateur.');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Aucun mot de passe défini. Contactez l\'administrateur.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const payload = { sub: user.id, fullName: user.fullName };
    const token = this.jwtService.sign(payload);

    const roles = user.roleAssignments.map((ra) => ({
      name: ra.role.name,
      assemblyId: ra.assemblyId ?? undefined,
      assemblyName: ra.assembly?.name,
    }));

    return {
      accessToken: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles,
        member: user.member,
      },
    };
  }

  async getMe(authUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        roleAssignments: { include: { role: true, assembly: true } },
        member: { include: { contacts: true } },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const roles = user.roleAssignments.map((ra) => ({
      name: ra.role.name,
      assemblyId: ra.assemblyId ?? undefined,
      assemblyName: ra.assembly?.name,
    }));

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      roles,
      member: user.member,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }
    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });
    return { message: 'Mot de passe modifié avec succès.' };
  }

  async logout() {
    // Le JWT est stateless : la déconnexion se fait côté client en supprimant le token.
    return { message: 'Déconnexion réussie.' };
  }
}
