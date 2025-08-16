import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { FormSevice } from './form.service';
import { Form } from './form.schema';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { AddSectionDtoInput } from './dto/add-section.dto.input';
import { CreateFormDtoInput } from './dto/create-form.dto.input';
import { GetAllFormDtoInput } from './dto/get-all-form.dto.input';

@ApiTags('Formulário')
@Controller('v1/form')
export class FormController {
  constructor(private readonly service: FormSevice) {}

  @Post()
  @ApiResponse({
    description: 'criação de formulário',
    type: Form,
  })
  async create(@Body() body: CreateFormDtoInput): Promise<Form> {
    return await this.service.create(body);
  }

  @Get(':id')
  @ApiResponse({
    description: 'buscar formulario por id',
    type: Form,
  })
  async findById(@Param('id') id: string): Promise<Form | null> {
    return await this.service.findById(id);
  }

  @Get()
  @ApiResponse({
    description: 'buscar todos formularios paginados',
  })
  async find(
    @Query() qyery: GetAllFormDtoInput,
  ): Promise<GetAllDtoOutput<Form>> {
    return await this.service.find(qyery);
  }

  @Patch('add-section')
  @ApiResponse({
    description: 'adiciona seção ao formulário',
  })
  async addSection(@Body() body: AddSectionDtoInput): Promise<Form | null> {
    return await this.service.addSection(body);
  }
}
