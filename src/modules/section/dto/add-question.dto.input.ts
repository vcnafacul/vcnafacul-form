import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddQuestionDtoInput {
  @ApiProperty()
  @IsString()
  sectionId: string;

  @ApiProperty()
  @IsString()
  questionId: string;
}
