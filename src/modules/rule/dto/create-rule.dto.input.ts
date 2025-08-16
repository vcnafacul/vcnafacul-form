import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { RuleType } from '../enum/rule-type';
import { Strategy } from '../enum/strategy';

export class CreateRuleDtoInput {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: RuleType })
  @IsEnum(RuleType)
  type: RuleType;

  @ApiProperty({ enum: Strategy })
  @IsEnum(Strategy)
  strategy: Strategy;

  @ApiProperty({ required: false })
  @IsMongoId()
  questionId: string;

  @ApiProperty({ type: Object, required: true })
  @IsObject()
  config: any;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  weight?: number;
}
