import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateSectionDtoInput {
  @ApiProperty()
  @IsString()
  name: string;
}
