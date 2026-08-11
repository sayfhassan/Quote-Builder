import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * Auth is out of scope for this exercise, so there's no login flow to pick
 * an identity from. This directory endpoint stands in for one, letting the
 * frontend offer a "log in as" switcher. It only exposes name/email/org —
 * never quote data — so it doesn't weaken tenant isolation.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAllForDirectory();
  }
}
