import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import {
  OwnershipContextHelper,
  OwnershipContext,
} from 'src/common/guards/ownership-context.helper';
import { FormRepository } from '../form/form.repository';
import { SectionRepository } from '../section/section.repository';
import { EnvService } from 'src/common/modules/env/env.service';
import { CreateQuestionDtoInput } from './dto/create-question.dto.input';
import { GetAllQuestionDtoInput } from './dto/get-all-question.dto.input';
import { UpdateQuestionDtoInput } from './dto/update-question.dto.input';
import { Question } from './question.schema';
import { QuestionSevice } from './question.service';

@ApiTags('Perguntas')
@Controller('v1/question')
export class QuestionController {
  constructor(
    private readonly service: QuestionSevice,
    private readonly formRepository: FormRepository,
    private readonly sectionRepository: SectionRepository,
    private readonly envService: EnvService,
  ) {}

  private extractOwnership(headers: Record<string, string | undefined>): OwnershipContext {
    return OwnershipContextHelper.extract(
      headers,
      this.envService.get('ADMIN_FORM_SECRET'),
    );
  }

  private async validateQuestionOwnership(
    sectionId: string,
    ctx: OwnershipContext,
  ): Promise<void> {
    const form = await this.formRepository.findFormBySectionId(sectionId);
    if (!form) {
      throw new HttpException('Form not found for section', HttpStatus.NOT_FOUND);
    }
    OwnershipContextHelper.validateOwnership(ctx, form);
  }

  private async findSectionByQuestionId(questionId: string): Promise<string> {
    const section = await this.sectionRepository.model.findOne({
      questions: questionId,
      deleted: false,
    });
    if (!section) {
      throw new HttpException('Section not found for question', HttpStatus.NOT_FOUND);
    }
    return section._id.toString();
  }

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
    - é só obrigatorio quando AnswerType for Options

    **Conditions** (opcional):
    - Define condições para exibição da pergunta
    - Permite criar regras baseadas em respostas de outras perguntas
    - Suporta operadores: Equal, NotEqual, GreaterThan, LessThan, Contains, etc.
    - Lógica de combinação: And, Or`,
    type: CreateQuestionDtoInput,
  })
  async create(
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: CreateQuestionDtoInput,
  ): Promise<Question> {
    const ctx = this.extractOwnership(headers);
    await this.validateQuestionOwnership(body.sectionId, ctx);
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

    **Conditions** (opcional):
    - Define condições para exibição da pergunta
    - Permite criar regras baseadas em respostas de outras perguntas
    - Suporta operadores: Equal, NotEqual, GreaterThan, LessThan, Contains, etc.
    - Lógica de combinação: And, Or

    **Nota**: Todos os campos são opcionais na edição. Apenas os campos fornecidos serão atualizados.`,
    type: UpdateQuestionDtoInput,
  })
  @ApiResponse({
    description: 'atualizar pergunta por id',
    type: Question,
  })
  async update(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: UpdateQuestionDtoInput,
  ): Promise<Question> {
    const ctx = this.extractOwnership(headers);
    const sectionId = await this.findSectionByQuestionId(id);
    await this.validateQuestionOwnership(sectionId, ctx);
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
  async delete(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ): Promise<void> {
    const ctx = this.extractOwnership(headers);
    const sectionId = await this.findSectionByQuestionId(id);
    await this.validateQuestionOwnership(sectionId, ctx);
    await this.service.delete(id);
  }

  @Patch(':id/set-active')
  @ApiResponse({
    description: 'define questão ativa',
  })
  async setActive(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ): Promise<void> {
    const ctx = this.extractOwnership(headers);
    const sectionId = await this.findSectionByQuestionId(id);
    await this.validateQuestionOwnership(sectionId, ctx);
    await this.service.setActive(id);
  }
}
