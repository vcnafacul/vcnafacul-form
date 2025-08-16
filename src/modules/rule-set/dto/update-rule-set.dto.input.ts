import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';

export enum Action {
  Add = 'add',
  Remove = 'remove',
}

export class UpdateRuleSetDtoInput {
  @ApiProperty()
  @IsMongoId()
  ruleSetId: string;

  @ApiProperty()
  @IsMongoId()
  ruleId: string;
}

export class UpdateRuleSetWithActionDtoInput extends UpdateRuleSetDtoInput {
  @ApiProperty({ enum: Action })
  @IsEnum(Action)
  action: Action;
}
