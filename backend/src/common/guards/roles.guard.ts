import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '../../auth/enums/role.enum';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    if (!user || !user.roles) {
      throw new ForbiddenException("Vous n'avez pas les permissions nécessaires.");
    }

    const userRoleNames = user.roles.map((r) => r.name);
    const hasRole = requiredRoles.some((r) => userRoleNames.includes(r));
    if (!hasRole) {
      throw new ForbiddenException(
        `Action réservée aux rôles : ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
