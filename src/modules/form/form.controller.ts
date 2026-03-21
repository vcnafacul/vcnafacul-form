import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { OwnerContext } from 'src/common/decorators/owner-context.decorator';
import type { OwnerContext as OwnerContextType } from 'src/common/interfaces/owner-context.interface';
import { CreateFormDtoInput } from './dto/create-form.dto.input';
import { GetAllFormDtoInput } from './dto/get-all-form.dto.input';
import { Form } from './form.schema';
import { FormSevice, HasActiveFormResponse } from './form.service';

@ApiTags('Formulário')
@Controller('v1/form')
export class FormController {
  constructor(private readonly service: FormSevice) {}

  @Post()
  async create(
    @Body() body: CreateFormDtoInput,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<Form> {
    return await this.service.create(body, ownerContext);
  }

  @Get()
  async find(
    @Query() query: GetAllFormDtoInput,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<GetAllDtoOutput<Form>> {
    return await this.service.find(query, ownerContext);
  }

  @Patch(':id/set-active')
  async setActive(
    @Param('id') id: string,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<void> {
    await this.service.setActive(id, ownerContext);
  }

  @Post(':inscriptionId/create-form-full')
  async createFormFull(
    @Param('inscriptionId') inscriptionId: string,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<string> {
    return await this.service.createFormFull(inscriptionId, ownerContext);
  }

  @Get('has-active')
  async hasActiveForm(
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<HasActiveFormResponse> {
    return await this.service.hasActiveForm(ownerContext);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Form | null> {
    return await this.service.findById(id);
  }
}
