import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GetAllDtoInput } from 'src/common/base/dto/get-all.dto.input';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { CreateSectionDtoInput } from './dto/create-section.dto.input';
import { Section } from './section.schema';
import { SectionSevice } from './section.service';
import { AddQuestionDtoInput } from './dto/add-question.dto.input';

@ApiTags('Seção')
@Controller('v1/section')
export class SectionController {
  constructor(private readonly service: SectionSevice) {}

  @Post()
  @ApiBody({
    description: 'criação de seção',
    type: Section,
  })
  async create(@Body() body: CreateSectionDtoInput): Promise<Section> {
    return await this.service.create(body);
  }

  @Get(':id')
  @ApiBody({
    description: 'buscar seção por id',
    type: Section,
  })
  async findById(@Param('id') id: string): Promise<Section | null> {
    return await this.service.findById(id);
  }

  @Get()
  @ApiBody({
    description: 'buscar todas seções paginadas',
  })
  async find(
    @Query() qyery: GetAllDtoInput,
  ): Promise<GetAllDtoOutput<Section>> {
    return await this.service.find(qyery);
  }

  @Patch('add-question')
  @ApiBody({
    description: 'adiciona seção ao formulário',
  })
  async addSection(@Body() body: AddQuestionDtoInput): Promise<Section | null> {
    return await this.service.addQuestion(body);
  }
}
