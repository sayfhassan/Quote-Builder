import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TenantGuard } from '../common/tenant.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { User } from '../users/user.entity';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Controller('quotes')
@UseGuards(TenantGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateQuoteDto) {
    return this.quotesService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.quotesService.findAll(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.quotesService.findOne(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(user, id, dto);
  }

  @Post(':id/sync')
  sync(@CurrentUser() user: User, @Param('id') id: string) {
    return this.quotesService.sync(user, id);
  }
}
