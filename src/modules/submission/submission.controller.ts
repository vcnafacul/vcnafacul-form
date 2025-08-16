import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Submission } from './submission.schema';
import { SubmissionSevice } from './submission.service';
import { CreateSubmissionDtoInput } from './dto/create-submission.dto.input';

@ApiTags('Respostas')
@Controller('v1/submission')
export class SubmissionController {
  constructor(private readonly service: SubmissionSevice) {}

  @Post()
  @ApiBody({
    description: 'responde formulário e gera submissão',
    type: Submission,
  })
  async create(@Body() body: CreateSubmissionDtoInput): Promise<Submission> {
    return await this.service.create(body);
  }

  @Get(':id')
  @ApiBody({
    description: 'buscar formulario por id',
    type: Submission,
  })
  async findById(@Param('id') id: string): Promise<Submission | null> {
    return await this.service.findById(id);
  }
}
