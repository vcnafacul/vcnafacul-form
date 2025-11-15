import { Controller, Get, Param } from '@nestjs/common';
import { FormFullService } from './formfull.service';
import { FormFull } from './schema/form-full.schema';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Formulário Estatico')
@Controller('v1/form-full')
export class FormFullController {
  constructor(private readonly service: FormFullService) {}

  @Get(':inscriptionId/inscription')
  async getByInscriptionId(@Param('inscriptionId') inscriptionId: string): Promise<FormFull> {
    return await this.service.getByInscriptionId(inscriptionId);
  }
}
