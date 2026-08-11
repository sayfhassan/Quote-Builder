import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';

/**
 * Auth is out of scope for this exercise. We treat the caller-supplied
 * X-User-Id as an authenticated identity and resolve it to a user + org.
 * Every downstream query scopes by request.user.organizationId, which is
 * what actually enforces tenant isolation.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (!userId || typeof userId !== 'string') {
      throw new UnauthorizedException('X-User-Id header is required');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    request.user = user;
    return true;
  }
}
