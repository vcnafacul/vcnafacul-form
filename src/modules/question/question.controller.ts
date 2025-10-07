import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { CreateQuestionDtoInput } from './dto/create-question.dto.input';
import { GetAllQuestionDtoInput } from './dto/get-all-question.dto.input';
import { UpdateQuestionDtoInput } from './dto/update-question.dto.input';
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

  @Put(':id')
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
    - é só obrigatorio quando AnswerType for Options
    
    **Nota**: Todos os campos são opcionais na edição. Apenas os campos fornecidos serão atualizados.`,
    type: UpdateQuestionDtoInput,
  })
  @ApiResponse({
    description: 'atualizar pergunta por id',
    type: Question,
  })
  async update(@Param('id') id: string, @Body() body: UpdateQuestionDtoInput): Promise<Question> {
    return await this.service.update(id, body);
  }

  @Delete(':id')
  @ApiResponse({
    description: 'excluir questão por id (soft delete)',
    status: 200,
  })
  @ApiResponse({
    description: 'Questão não encontrada',
    status: 404,
  })
  @ApiResponse({
    description: 'Erro interno na exclusão',
    status: 400,
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(id);
  }
}
