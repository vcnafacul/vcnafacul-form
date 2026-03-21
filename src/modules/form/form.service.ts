import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { OwnerContext } from 'src/common/interfaces/owner-context.interface';
import { SectionRepository } from '../section/section.repository';
import { CreateFormDtoInput } from './dto/create-form.dto.input';
import { FormRepository } from './form.repository';
import { Form } from './form.schema';
import { formFullMapper } from '../form-full/utils/form-full.mapper';
import { FormFullRepository } from '../form-full/form-full.repository';

export interface HasActiveFormResponse {
  canCreate: boolean;
  globalFormReady: boolean;
  partnerFormReady: boolean;
  message?: string;
}

@Injectable()
export class FormSevice {
  constructor(
    private readonly repository: FormRepository,
    private readonly sectionRepository: SectionRepository,
    private readonly formFullRepository: FormFullRepository,
  ) {}

  async create(dto: CreateFormDtoInput, ownerContext: OwnerContext): Promise<Form> {
    const form = new Form();
    form.name = dto.name;
    form.ownerType = ownerContext.ownerType;
    form.ownerId = ownerContext.ownerId;
    return await this.repository.create(form);
  }

  async findById(id: string): Promise<Form | null> {
    return await this.repository.findBy({ _id: id });
  }

  async find(data: GetAllInput, ownerContext: OwnerContext): Promise<GetAllOutput<Form>> {
    return await this.repository.find({
      ...data,
      where: {
        ...(data as any).where,
        ownerType: ownerContext.ownerType,
        ownerId: ownerContext.ownerId,
      },
    });
  }

  async setActive(formId: string, ownerContext: OwnerContext) {
    const form = await this.repository.findBy({ _id: formId });
    if (!form) {
      throw new HttpException('form id not exist', HttpStatus.NOT_FOUND);
    }
    if (form.ownerType !== ownerContext.ownerType || form.ownerId !== ownerContext.ownerId) {
      throw new HttpException('form does not belong to this owner', HttpStatus.FORBIDDEN);
    }
    const oldForm = await this.repository.findByOwner({ active: true }, ownerContext);
    if (oldForm) {
      oldForm.active = false;
      await this.repository.updateOne(oldForm);
    }
    form.active = true;
    await this.repository.updateOne(form);
  }

  async hasActiveForm(ownerContext: OwnerContext): Promise<HasActiveFormResponse> {
    const globalForm = await this.repository.findActiveFormFull('GLOBAL', null);
    const globalFormReady = !!(
      globalForm &&
      !globalForm.deleted &&
      globalForm.sections.length > 0
    );

    let partnerFormReady = false;
    if (ownerContext.ownerType === 'PARTNER') {
      const partnerForm = await this.repository.findActiveFormFull(
        'PARTNER',
        ownerContext.ownerId,
      );
      partnerFormReady = !!(
        partnerForm &&
        !partnerForm.deleted &&
        partnerForm.sections.length > 0
      );
    }

    const canCreate = globalFormReady || partnerFormReady;

    let message: string | undefined;
    if (!canCreate) {
      if (!globalForm && !partnerFormReady) {
        message = 'Nenhum formulário foi configurado. Entre em contato com o administrador.';
      } else {
        message =
          'Nenhum formulário possui seções ativas. Configure seu formulário ou entre em contato com o administrador.';
      }
    }

    return { canCreate, globalFormReady, partnerFormReady, message };
  }

  async createFormFull(inscriptionId: string, ownerContext: OwnerContext): Promise<string> {
    const globalForm = await this.repository.findActiveFormFull('GLOBAL', null);
    let partnerForm: Form | null = null;

    if (ownerContext.ownerType === 'PARTNER') {
      partnerForm = await this.repository.findActiveFormFull(
        'PARTNER',
        ownerContext.ownerId,
      );
    }

    if (!globalForm && !partnerForm) {
      throw new HttpException(
        'Nenhum formulário ativo encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    const hasGlobalSections =
      globalForm && !globalForm.deleted && globalForm.sections.length > 0;
    const hasPartnerSections =
      partnerForm && !partnerForm.deleted && partnerForm.sections.length > 0;

    if (!hasGlobalSections && !hasPartnerSections) {
      throw new HttpException(
        'Nenhum formulário possui seções ativas',
        HttpStatus.NOT_FOUND,
      );
    }

    const formFull = formFullMapper(
      hasGlobalSections ? globalForm : null,
      hasPartnerSections ? partnerForm : null,
      inscriptionId,
    );
    const formFullCreated = await this.formFullRepository.create(formFull);
    return formFullCreated._id.toString();
  }
}
