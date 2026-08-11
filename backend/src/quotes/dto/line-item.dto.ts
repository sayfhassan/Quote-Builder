import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class LineItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}
