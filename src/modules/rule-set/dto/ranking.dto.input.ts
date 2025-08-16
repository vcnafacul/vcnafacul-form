import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsString,
} from 'class-validator';

export class RankingDtoInput {
  @ApiProperty()
  @IsMongoId()
  ruleSetId: string;

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ArrayUnique() // opcional: evita opções duplicadas
  users: string[];
}
