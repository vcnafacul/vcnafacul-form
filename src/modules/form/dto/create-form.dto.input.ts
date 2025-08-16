import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFormDtoInput {
  @ApiProperty()
  @IsString()
  name: string;
}
