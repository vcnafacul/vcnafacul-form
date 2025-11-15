import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ReorderQuestionsDtoInput {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  questionIds: string[];
}
