import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AnswerDto {
  @ApiProperty()
  @IsMongoId({ message: 'questionId deve ser um ObjectId válido' })
  questionId: string;

  @ApiProperty()
  @IsString()
  question: string;

  // value é dinâmico. Validamos forma no service.
  @ApiProperty({ description: 'Pode ser string | number | boolean | string[]' })
  @IsNotEmpty({ message: 'value não pode ser vazio' })
  answer: any;
}

export class CreateSubmissionDtoInput {
  @ApiProperty()
  @IsString()
  inscriptionId: string;

  // userId normalmente vem do token; se vier no body, valide:
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  email: string;

  @IsDateString()
  @ApiProperty()
  birthday: Date;

  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
