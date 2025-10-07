import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { AnswerCollectionType } from '../enum/answer-collection-type';
import { AnswerType } from '../enum/answer-type';

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
}
