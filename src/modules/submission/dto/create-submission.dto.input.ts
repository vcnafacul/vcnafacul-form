import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AnswerDto {
  @ApiProperty()
  @IsMongoId({ message: 'questionId deve ser um ObjectId válido' })
  questionId: string;

  // value é dinâmico. Validamos forma no service.
  @ApiProperty({ description: 'Pode ser string | number | boolean | string[]' })
  @IsNotEmpty({ message: 'value não pode ser vazio' })
  value: any;
}

export class CreateSubmissionDtoInput {
  @ApiProperty()
  @IsMongoId({ message: 'formId deve ser um ObjectId válido' })
  formId: string;

  // userId normalmente vem do token; se vier no body, valide:
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
