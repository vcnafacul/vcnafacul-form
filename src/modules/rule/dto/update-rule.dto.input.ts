import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsObject, IsOptional, IsString } from 'class-validator';
import { RuleType } from '../enum/rule-type';
import { Strategy } from '../enum/strategy';

export class UpdateRuleDtoInput {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: RuleType, required: false })
  @IsOptional()
  @IsEnum(RuleType)
  type?: RuleType;

  @ApiProperty({ enum: Strategy, required: false })
  @IsOptional()
  @IsEnum(Strategy)
  strategy?: Strategy;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  questionId?: string;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  @IsObject()
  config?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  weight?: number;
}
