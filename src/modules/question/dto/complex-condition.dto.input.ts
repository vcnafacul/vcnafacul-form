import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Logic } from '../enum/logic';
import { BaseConditionDtoInput } from './base-condition.dto.input';

export class ComplexConditionDtoInput {
  @ApiProperty({
    type: [BaseConditionDtoInput],
    description: 'Array de condições que serão avaliadas',
    example: [
      {
        questionId: '507f1f77bcf86cd799439011',
        operator: 'Equal',
        expectedValue: 'Sim',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseConditionDtoInput)
  conditions: BaseConditionDtoInput[];

  @ApiProperty({
    enum: Logic,
    description: 'Lógica de combinação das condições (AND/OR)',
    example: Logic.And,
  })
  @IsEnum(Logic)
  logic: Logic;
}
