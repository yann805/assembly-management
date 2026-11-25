import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  roles: Array<{ name: string; assemblyId?: string }>;
  activeAssemblyId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return data ? user?.[data] : user;
  },
);
