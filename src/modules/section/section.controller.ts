import {
  Body, Controller, Delete, forwardRef, Get, Headers, HttpException, HttpStatus,
  Inject, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBody, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDtoInput } from 'src/common/base/dto/get-all.dto.input';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import {
  OwnershipContextHelper,
  OwnershipContext,
} from 'src/common/guards/ownership-context.helper';
import { OwnerType } from '../form/enum/owner-type.enum';
import { FormRepository } from '../form/form.repository';
import { EnvService } from 'src/common/modules/env/env.service';
import { CreateSectionDtoInput } from './dto/create-section.dto.input';
import { Section } from './section.schema';
import { SectionSevice } from './section.service';
import { UpdateSectionDtoInput } from './dto/update-section.dto.input';
import { ReorderQuestionsDtoInput } from './dto/reorder-questions.dto.input';
import { FormSevice } from '../form/form.service';

@ApiTags('Seção')
@Controller('v1/section')
export class SectionController {
  constructor(
    private readonly service: SectionSevice,
    private readonly formRepository: FormRepository,
    @Inject(forwardRef(() => FormSevice))
    private readonly formService: FormSevice,
    private readonly envService: EnvService,
  ) {}

  private extractOwnership(headers: Record<string, string | undefined>): OwnershipContext {
    return OwnershipContextHelper.extract(
      headers,
      this.envService.get('ADMIN_FORM_SECRET'),
    );
  }

  private async resolveFormIdForOwner(ctx: OwnershipContext): Promise<string> {
    let form =
      ctx.ownerType === OwnerType.GLOBAL
        ? await this.formRepository.findActiveGlobalForm()
        : await this.formRepository.findActivePartnerForm(ctx.ownerId!);

    // Lazy creation: cursinhos antigos podem não ter form ainda
    if (!form && ctx.ownerType === OwnerType.PARTNER && ctx.ownerId) {
      try {
        form = await this.formService.create({
          name: 'Formulário do Cursinho',
          ownerType: OwnerType.PARTNER,
          ownerId: ctx.ownerId,
        });
      } catch {
        // Race condition: outro request já criou — busca o que existe
        form = await this.formRepository.findActivePartnerForm(ctx.ownerId);
      }
    }

    if (!form) {
      throw new HttpException('No active form for this owner', HttpStatus.NOT_FOUND);
    }
    return form._id.toString();
  }

  private async validateSectionOwnership(
    sectionId: string,
    ctx: OwnershipContext,
  ): Promise<void> {
    const form = await this.formRepository.findFormBySectionId(sectionId);
    if (!form) {
      throw new HttpException('Form not found for section', HttpStatus.NOT_FOUND);
    }
    OwnershipContextHelper.validateOwnership(ctx, form);
  }

  @Post()
  @ApiProperty({
    description: 'criação de seção',
    type: Section,
  })
  async create(
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: CreateSectionDtoInput,
  ): Promise<Section> {
    const ctx = this.extractOwnership(headers);
    const formId = await this.resolveFormIdForOwner(ctx);
    return await this.service.create(body, formId);
  }

  @Get(':id')
  @ApiProperty({
    description: 'buscar seção por id',
    type: Section,
  })
  async findById(@Param('id') id: string): Promise<Section | null> {
    return await this.service.findById(id);
  }

  @Get()
  @ApiProperty({
    description: 'buscar todas seções paginadas (filtrado por ownership via headers)',
  })
  async find(
    @Headers() headers: Record<string, string | undefined>,
    @Query() query: GetAllDtoInput,
  ): Promise<GetAllDtoOutput<Section>> {
    const ownerType = headers['x-owner-type'] as OwnerType | undefined;
    const ownerId = headers['x-owner-id'] as string | undefined;

    // Se headers de ownership presentes, retornar apenas seções do form daquele owner
    if (ownerType) {
      return await this.service.findByOwner(ownerType, ownerId, query);
    }

    // Fallback: retorna todas (backward compat para admin sem filtro)
    return await this.service.find(query);
  }

  @Patch(':id/set-active')
  @ApiProperty({
    description: 'define seção ativa',
  })
  async setActive(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ): Promise<void> {
    const ctx = this.extractOwnership(headers);
    await this.validateSectionOwnership(id, ctx);
    await this.service.setActive(id);
  }

  @Delete(':id')
  @ApiResponse({
    description: 'excluir seção por id (apenas se não houver questões associadas)',
    status: 200,
  })
  @ApiResponse({
    description: 'Seção não encontrada',
    status: 404,
  })
  @ApiResponse({
    description: 'Não é possível excluir pois existem questões associadas',
    status: 409,
  })
  async delete(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ): Promise<void> {
    const ctx = this.extractOwnership(headers);
    await this.validateSectionOwnership(id, ctx);
    await this.service.delete(id);
  }

  @Patch(':id')
  @ApiProperty({
    description: 'atualizar seção por id',
  })
  async update(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: UpdateSectionDtoInput,
  ): Promise<void> {
    const ctx = this.extractOwnership(headers);
    await this.validateSectionOwnership(id, ctx);
    await this.service.update(id, body);
  }

  @Patch(':id/reorder')
  @ApiBody({
    description: `
    Reordena as questões de uma seção.

    **Validações**:
    - Todos os IDs fornecidos devem pertencer à seção
    - Todos os IDs da seção devem estar presentes no array
    - A quantidade de IDs deve corresponder exatamente

    Se qualquer validação falhar, a reordenação não será permitida.`,
    type: ReorderQuestionsDtoInput,
  })
  @ApiResponse({
    description: 'Questões reordenadas com sucesso',
    status: 200,
  })
  @ApiResponse({
    description: 'Seção não encontrada',
    status: 404,
  })
  @ApiResponse({
    description: 'Erro de validação - IDs faltando ou inválidos',
    status: 400,
  })
  async reorderQuestions(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: ReorderQuestionsDtoInput,
  ): Promise<void> {
    const ctx = this.extractOwnership(headers);
    await this.validateSectionOwnership(id, ctx);
    await this.service.reorderQuestions(id, body);
  }

  @Post(':id/duplicate')
  @ApiProperty({
    description:
      'Duplica uma seção com todas as suas questões, adicionando o sufixo "_copy" ao nome',
    type: Section,
  })
  @ApiResponse({
    description: 'Seção duplicada com sucesso',
    status: 201,
  })
  @ApiResponse({
    description: 'Seção não encontrada',
    status: 404,
  })
  @ApiResponse({
    description: 'Erro ao duplicar a seção',
    status: 400,
  })
  async duplicate(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ): Promise<void> {
    const ctx = this.extractOwnership(headers);
    await this.validateSectionOwnership(id, ctx);
    await this.service.duplicate(id);
  }
}
