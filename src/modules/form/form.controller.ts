import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { CreateFormDtoInput } from './dto/create-form.dto.input';
import { GetAllFormDtoInput } from './dto/get-all-form.dto.input';
import { Form } from './form.schema';
import { FormSevice } from './form.service';

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
  async find(@Query() qyery: GetAllFormDtoInput): Promise<GetAllDtoOutput<Form>> {
    return await this.service.find(qyery);
  }

  @Patch(':id/set-active')
  @ApiResponse({
    description: 'define formulário ativo',
  })
  async setActive(@Param('id') id: string): Promise<void> {
    await this.service.setActive(id);
  }

  @Post(':inscriptionId/get-form-full')
  @ApiResponse({
    description: 'get form full',
  })
  async getFormFull(@Param('inscriptionId') inscriptionId: string): Promise<string> {
    return await this.service.getFormFull(inscriptionId);
  }
}
