import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFormFullDtoInput {
  @ApiProperty()
  @IsString()
  partnerId: string;
}
