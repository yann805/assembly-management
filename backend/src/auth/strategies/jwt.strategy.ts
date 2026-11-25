import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleName } from '../enums/role.enum';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  fullName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'default-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roleAssignments: { include: { role: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Compte invalide ou désactivé.');
    }

    const roles = user.roleAssignments.map((ra) => ({
      name: ra.role.name,
      assemblyId: ra.assemblyId ?? undefined,
    }));

    // activeAssemblyId = première assemblée assignée (pour trésorier/dirigeant)
    const activeAssemblyId = roles.find((r) => r.assemblyId)?.assemblyId;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      roles,
      activeAssemblyId,
    };
  }
}
