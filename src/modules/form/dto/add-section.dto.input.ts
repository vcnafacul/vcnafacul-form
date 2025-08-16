import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddSectionDtoInput {
  @ApiProperty()
  @IsString()
  formId: string;

  @ApiProperty()
  @IsString()
  sectionId: string;
}
