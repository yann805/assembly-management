import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleName } from '../../auth/enums/role.enum';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Vérifie que l'utilisateur (trésorier/dirigeant) a bien accès à l'assemblée
 * ciblée par la requête. Empêche un trésorier d'accéder aux données d'une autre assemblée.
 */
@Injectable()
export class AssemblyScopeGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    if (!user) return true;

    // L'administrateur général a accès à tout
    const isGeneralTreasury = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    if (isGeneralTreasury) return true;

    // Déterminer l'assemblyId ciblé (params, query ou body)
    const assemblyId =
      request.params?.assemblyId ||
      request.params?.id ||
      request.body?.assemblyId ||
      request.query?.assemblyId;

    if (!assemblyId) {
      // Pas d'assemblée ciblée explicitement — on laisse passer
      // (le service doit filtrer selon le scope de l'utilisateur)
      return true;
    }

    const userAssemblies = user.roles
      .filter((r) => r.assemblyId)
      .map((r) => r.assemblyId);

    if (!userAssemblies.includes(assemblyId)) {
      throw new ForbiddenException(
        "Vous n'avez pas accès à cette assemblée.",
      );
    }

    request.userAssemblyId = assemblyId;
    return true;
  }
}
