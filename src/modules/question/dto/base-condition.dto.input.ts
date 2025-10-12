import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Operator } from '../enum/operator';

export class BaseConditionDtoInput {
  @ApiProperty({
    description: 'ID da questão que será avaliada na condição',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    enum: Operator,
    description: 'Operador de comparação para avaliar a condição',
    example: Operator.Equal,
  })
  @IsEnum(Operator)
  operator: Operator;

  @ApiProperty({
    description: 'Valor esperado para comparação na condição',
    example: 'Sim',
  })
  @IsString()
  expectedValue: string;
}
