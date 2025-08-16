import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { CreateQuestionDtoInput } from './dto/create-question.dto.input';
import { GetAllQuestionDtoInput } from './dto/get-all-question.dto.input';
import { Question } from './question.schema';
import { QuestionSevice } from './question.service';

@ApiTags('Perguntas')
@Controller('v1/question')
export class QuestionController {
  constructor(private readonly service: QuestionSevice) {}

  @Post()
  @ApiBody({
    description: `
    **AnswerType**:
    - Text: resposta textual livre
    - Number: resposta numérica
    - Boolean: verdadeiro/falso
    - Options: seleção de opções predefinidas

    **AnswerCollectionType**:
    - single: apenas uma resposta
    - multiple: múltiplas respostas permitidas

    **Options**:
    - é só obrigatorio quando AnswerType for Options`,
    type: CreateQuestionDtoInput,
  })
  async create(@Body() body: CreateQuestionDtoInput): Promise<Question> {
    return await this.service.create(body);
  }

  @Get(':id')
  @ApiResponse({
    description: 'buscar pergunta por id',
    type: Question,
  })
  async findById(@Param('id') id: string): Promise<Question | null> {
    return await this.service.findById(id);
  }

  @Get()
  @ApiResponse({
    description: 'buscar todas perguntas paginadas',
  })
  async find(@Query() qyery: GetAllQuestionDtoInput): Promise<GetAllDtoOutput<Question>> {
    return await this.service.find(qyery);
  }
}
