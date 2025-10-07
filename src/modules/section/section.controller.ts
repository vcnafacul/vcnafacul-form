import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDtoInput } from 'src/common/base/dto/get-all.dto.input';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { CreateSectionDtoInput } from './dto/create-section.dto.input';
import { Section } from './section.schema';
import { SectionSevice } from './section.service';

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
}
