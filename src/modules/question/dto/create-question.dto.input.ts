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

export class CreateQuestionDtoInput {
  @ApiProperty()
  @IsString()
  @IsOptional()
  sectionId: string;

  @ApiProperty()
  @IsString({ message: 'O texto da pergunta deve ser um texto' })
  text: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  helpText?: string;

  @ApiProperty({ enum: AnswerType })
  @IsEnum(AnswerType, { message: 'Tipo de resposta inválido' })
  answerType: AnswerType;

  @ApiProperty({
    enum: AnswerCollectionType,
    default: AnswerCollectionType.Single,
  })
  @IsEnum(AnswerCollectionType, { message: 'Tipo de coleção inválido' })
  collection: AnswerCollectionType;

  // Só valida/exige quando for Options
  @ApiPropertyOptional({
    type: [String],
    description: 'Obrigatório quando answerType = Options',
  })
  @ValidateIf((o) => o.answerType === AnswerType.Options)
  @IsArray({ message: 'As opções devem ser uma lista' })
  @ArrayNotEmpty({ message: 'Informe pelo menos uma opção' })
  @IsString({ each: true, message: 'Cada opção deve ser um texto' })
  // Mensagens em português (tickets-documentacao, card 26): chegam ao toast.
  @ArrayUnique({ message: 'As opções não podem se repetir' })
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
