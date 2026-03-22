import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OwnerType } from '../enum/owner-type.enum';

export class CreateFormDtoInput {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: OwnerType })
  @IsEnum(OwnerType)
  ownerType: OwnerType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ownerId?: string;
}
