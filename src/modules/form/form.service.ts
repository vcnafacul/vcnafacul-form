import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { SectionRepository } from '../section/section.repository';
import { CreateFormDtoInput } from './dto/create-form.dto.input';
import { FormRepository } from './form.repository';
import { Form } from './form.schema';
import { formFullMapper } from '../form-full/utils/form-full.mapper';
import { FormFullRepository } from '../form-full/form-full.repository';
import { OwnerType } from './enum/owner-type.enum';

@Injectable()
export class FormSevice {
  constructor(
    private readonly repository: FormRepository,
    private readonly sectionRepository: SectionRepository,
    private readonly formFullRepository: FormFullRepository,
  ) {}

  async create(dto: CreateFormDtoInput): Promise<Form> {
    if (dto.ownerType === OwnerType.GLOBAL) {
      const existing = await this.repository.findOne({
        ownerType: OwnerType.GLOBAL,
        deleted: false,
      });
      if (existing) {
        throw new HttpException(
          'Global Form already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    const form = new Form();
    form.name = dto.name;
    form.ownerType = dto.ownerType;
    form.ownerId = dto.ownerId ?? null;
    // Partner forms são auto-ativados (1 form por partner)
    if (dto.ownerType === OwnerType.PARTNER) {
      form.active = true;
    }

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

    if (form.ownerType === OwnerType.GLOBAL) {
      const oldForm = await this.repository.findActiveGlobalForm();
      if (oldForm && oldForm._id.toString() !== form._id.toString()) {
        oldForm.active = false;
        await this.repository.updateOne(oldForm);
      }
    } else {
      const oldForm = await this.repository.findActivePartnerForm(
        form.ownerId!,
      );
      if (oldForm && oldForm._id.toString() !== form._id.toString()) {
        oldForm.active = false;
        await this.repository.updateOne(oldForm);
      }
    }

    form.active = true;
    await this.repository.updateOne(form);
  }

  async hasActiveForm(partnerId?: string): Promise<boolean> {
    const globalForm = await this.repository.findActiveGlobalFormFull();
    const globalHasContent =
      globalForm && !globalForm.deleted && globalForm.sections.length > 0;

    let partnerHasContent = false;
    if (partnerId) {
      const partnerForm =
        await this.repository.findActivePartnerFormFull(partnerId);
      partnerHasContent =
        !!partnerForm && !partnerForm.deleted && partnerForm.sections.length > 0;
    }

    if (!globalHasContent && !partnerHasContent) {
      throw new HttpException(
        'Nenhum formulário ativo com seções e questões foi encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    return true;
  }

  async createFormFull(
    inscriptionId: string,
    partnerId: string,
  ): Promise<string> {
    const globalForm = await this.repository.findActiveGlobalFormFull();
    if (!globalForm || globalForm.deleted) {
      throw new HttpException(
        'No active global form configured',
        HttpStatus.NOT_FOUND,
      );
    }

    const partnerForm =
      await this.repository.findActivePartnerFormFull(partnerId);

    const formFull = formFullMapper(globalForm, partnerForm, inscriptionId);

    if (formFull.sections.length === 0) {
      throw new HttpException(
        'Nenhuma seção ativa com questões foi encontrada nos formulários',
        HttpStatus.BAD_REQUEST,
      );
    }

    const created = await this.formFullRepository.create(formFull);
    return created._id.toString();
  }
}
