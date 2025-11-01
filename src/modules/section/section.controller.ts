import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDtoInput } from 'src/common/base/dto/get-all.dto.input';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { CreateSectionDtoInput } from './dto/create-section.dto.input';
import { Section } from './section.schema';
import { SectionSevice } from './section.service';
import { UpdateSectionDtoInput } from './dto/update-section.dto.input';
import { ReorderQuestionsDtoInput } from './dto/reorder-questions.dto.input';

@ApiTags('Seção')
@Controller('v1/section')
export class SectionController {
  constructor(private readonly service: SectionSevice) {}

  @Post()
  @ApiProperty({
    description: 'criação de seção',
    type: Section,
  })
  async create(@Body() body: CreateSectionDtoInput): Promise<Section> {
    return await this.service.create(body);
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
    description: 'buscar todas seções paginadas',
  })
  async find(@Query() qyery: GetAllDtoInput): Promise<GetAllDtoOutput<Section>> {
    return await this.service.find(qyery);
  }

  @Patch(':id/set-active')
  @ApiProperty({
    description: 'define seção ativa',
  })
  async setActive(@Param('id') id: string): Promise<void> {
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
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(id);
  }

  @Patch(':id')
  @ApiProperty({
    description: 'atualizar seção por id',
  })
  async update(@Param('id') id: string, @Body() body: UpdateSectionDtoInput): Promise<void> {
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
    @Param('id') id: string,
    @Body() body: ReorderQuestionsDtoInput,
  ): Promise<void> {
    await this.service.reorderQuestions(id, body);
  }
}
