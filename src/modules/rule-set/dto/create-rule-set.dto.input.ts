import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRuleSetDtoInput {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  inscriptionId: string;
}
