import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAllDtoInput } from 'src/common/base/dto/get-all.dto.input';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { OwnerContext } from 'src/common/decorators/owner-context.decorator';
import type { OwnerContext as OwnerContextType } from 'src/common/interfaces/owner-context.interface';
import { CreateSectionDtoInput } from './dto/create-section.dto.input';
import { ReorderQuestionsDtoInput } from './dto/reorder-questions.dto.input';
import { UpdateSectionDtoInput } from './dto/update-section.dto.input';
import { Section } from './section.schema';
import { SectionSevice } from './section.service';

@ApiTags('Seção')
@Controller('v1/section')
export class SectionController {
  constructor(private readonly service: SectionSevice) {}

  @Post()
  async create(
    @Body() body: CreateSectionDtoInput,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<Section> {
    return await this.service.create(body, ownerContext);
  }

  @Get('global-active')
  async findGlobalActiveSections(): Promise<Section[]> {
    return await this.service.findGlobalActiveSections();
  }

  @Get()
  async find(
    @Query() query: GetAllDtoInput,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<GetAllDtoOutput<Section>> {
    return await this.service.find(query, ownerContext);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Section | null> {
    return await this.service.findById(id);
  }

  @Patch(':id/set-active')
  async setActive(
    @Param('id') id: string,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<void> {
    await this.service.setActive(id, ownerContext);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<void> {
    await this.service.delete(id, ownerContext);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateSectionDtoInput,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<void> {
    await this.service.update(id, body, ownerContext);
  }

  @Patch(':id/reorder')
  async reorderQuestions(
    @Param('id') id: string,
    @Body() body: ReorderQuestionsDtoInput,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<void> {
    await this.service.reorderQuestions(id, body, ownerContext);
  }

  @Post(':id/duplicate')
  async duplicate(
    @Param('id') id: string,
    @OwnerContext() ownerContext: OwnerContextType,
  ): Promise<void> {
    await this.service.duplicate(id, ownerContext);
  }
}
