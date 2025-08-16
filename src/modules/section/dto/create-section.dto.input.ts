import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSectionDtoInput {
  @ApiProperty()
  @IsString()
  name: string;
}
