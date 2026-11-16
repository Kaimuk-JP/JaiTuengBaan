import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private roleSatisfies(userRole: string | undefined, requiredRole: string) {
    if (!userRole) return false;
    if (userRole === 'ADMIN') return true;
    if (userRole === requiredRole) return true;
    if (userRole === 'EXECUTIVE' && requiredRole === 'STAFF') return true;
    return false;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    }

    const hasRole = requiredRoles.some((role) => this.roleSatisfies(user.role, role));

    if (!hasRole) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
    }

    return true;
  }
}
