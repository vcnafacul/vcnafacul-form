import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { SectionRepository } from '../section/section.repository';
import { CreateFormDtoInput } from './dto/create-form.dto.input';
import { FormRepository } from './form.repository';
import { Form } from './form.schema';
import { formFullMapper } from '../form-full/utils/form-full.mapper';
import { FormFullRepository } from '../form-full/form-full.repository';

@Injectable()
export class FormSevice {
  constructor(
    private readonly repository: FormRepository,
    private readonly sectionRepository: SectionRepository,
    private readonly formFullRepository: FormFullRepository,
  ) {}

  async create(dto: CreateFormDtoInput): Promise<Form> {
    const form = new Form();
    form.name = dto.name;

    return await this.repository.create(form);
  }

  async findById(id: string): Promise<Form | null> {
    return await this.repository.findBy({ _id: id });
  }

  async find(data: GetAllInput): Promise<GetAllOutput<Form>> {
    return await this.repository.find(data);
  }

  async setActive(formId: string) {
    const form = await this.repository.findBy({ _id: formId });
    if (!form) {
      throw new HttpException('form id not exist', HttpStatus.NOT_FOUND);
    }
    const oldForm = await this.repository.findBy({ active: true, deleted: false });
    if (oldForm) {
      oldForm.active = false;
      await this.repository.updateOne(oldForm);
    }
    form.active = true;
    await this.repository.updateOne(form);
  }

  // ao inves de buscar por id, deve buscar o formulario ativo, que é um unico formulario
  async getFormFull(inscriptionId: string): Promise<string> {
    const form = await this.repository.findBy({ active: true, deleted: false });
    if (!form) {
      throw new HttpException('form id not exist', HttpStatus.NOT_FOUND);
    }

    const formFull = formFullMapper(form, inscriptionId);

    // criar uma transação para garantir a consistência dos dados
    const session = await this.repository.startSession();
    session.startTransaction();

    await this.repository.updateOne(form, { session });
    const formFullCreated = await this.formFullRepository.create(formFull, { session });

    await session.commitTransaction();
    await session.endSession();

    return formFullCreated._id.toString();
  }
}
