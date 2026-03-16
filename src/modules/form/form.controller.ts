import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import {
  OwnershipContextHelper,
  OwnershipContext,
} from 'src/common/guards/ownership-context.helper';
import { EnvService } from 'src/common/modules/env/env.service';
import { CreateFormDtoInput } from './dto/create-form.dto.input';
import { CreateFormFullDtoInput } from './dto/create-form-full.dto.input';
import { GetAllFormDtoInput } from './dto/get-all-form.dto.input';
import { Form } from './form.schema';
import { FormSevice } from './form.service';
import { FormRepository } from './form.repository';

@ApiTags('Formulário')
@Controller('v1/form')
export class FormController {
  constructor(
    private readonly service: FormSevice,
    private readonly repository: FormRepository,
    private readonly envService: EnvService,
  ) {}

  private extractOwnership(headers: Record<string, string | undefined>): OwnershipContext {
    return OwnershipContextHelper.extract(
      headers,
      this.envService.get('ADMIN_FORM_SECRET'),
    );
  }

  @Post()
  @ApiResponse({
    description: 'criação de formulário',
    type: Form,
  })
  async create(
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: CreateFormDtoInput,
  ): Promise<Form> {
    const ctx = this.extractOwnership(headers);
    // Enforce: body ownerType must match context
    body.ownerType = ctx.ownerType;
    body.ownerId = ctx.ownerId ?? undefined;
    return await this.service.create(body);
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
  async setActive(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ): Promise<void> {
    const ctx = this.extractOwnership(headers);
    const form = await this.repository.findBy({ _id: id });
    if (form) {
      OwnershipContextHelper.validateOwnership(ctx, form);
    }
    await this.service.setActive(id);
  }

  @Post(':inscriptionId/create-form-full')
  @ApiResponse({
    description: 'criação de formulário estático',
  })
  async createFormFull(
    @Param('inscriptionId') inscriptionId: string,
    @Body() body: CreateFormFullDtoInput,
  ): Promise<string> {
    return await this.service.createFormFull(inscriptionId, body.partnerId);
  }

  @Get('has-active')
  @ApiResponse({
    description: 'verifica se existe um formulário ativo',
  })
  async hasActiveForm(
    @Query('partnerId') partnerId?: string,
  ): Promise<boolean> {
    return await this.service.hasActiveForm(partnerId);
  }

  @Get(':id')
  @ApiResponse({
    description: 'buscar formulario por id',
    type: Form,
  })
  async findById(@Param('id') id: string): Promise<Form | null> {
    return await this.service.findById(id);
  }
}
