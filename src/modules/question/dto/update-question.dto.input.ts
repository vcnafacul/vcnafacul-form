import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnswerCollectionType } from '../enum/answer-collection-type';
import { AnswerType } from '../enum/answer-type';
import { ComplexConditionDtoInput } from './complex-condition.dto.input';

export class UpdateQuestionDtoInput {
  @ApiProperty()
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  helpText?: string;

  @ApiProperty({ enum: AnswerType })
  @IsEnum(AnswerType)
  @IsOptional()
  answerType?: AnswerType;

  @ApiProperty({
    enum: AnswerCollectionType,
    default: AnswerCollectionType.Single,
  })
  @IsEnum(AnswerCollectionType)
  @IsOptional()
  collection?: AnswerCollectionType;

  // Só valida/exige quando for Options
  @ApiPropertyOptional({
    type: [String],
    description: 'Obrigatório quando answerType = Options',
  })
  @ValidateIf((o) => o.answerType === AnswerType.Options)
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ArrayUnique() // opcional: evita opções duplicadas
  options?: string[];

  @ApiPropertyOptional({
    type: ComplexConditionDtoInput,
    description: 'Condições para exibição da pergunta (opcional)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ComplexConditionDtoInput)
  conditions?: ComplexConditionDtoInput;
}
