import { Injectable, NotFoundException } from '@nestjs/common';
import { FormFullRepository } from './form-full.repository';
import { FormFull } from './schema/form-full.schema';

@Injectable()
export class FormFullService {
  constructor(private readonly formFullRepository: FormFullRepository) {}

  //getByInscriptionId
  async getByInscriptionId(inscriptionId: string): Promise<FormFull> {
    const formFull = await this.formFullRepository.findOneBy({ where: { inscriptionId } });
    if (!formFull) {
      throw new NotFoundException('Formulário não encontrado');
    }
    return formFull;
  }
}
