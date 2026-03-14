import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { createRepository } from 'src/common/base/base.repository';
import { Form } from './form.schema';
import { OwnerType } from './enum/owner-type.enum';

@Injectable()
export class FormRepository extends createRepository(Form) {
  async findBy(where: object): Promise<Form | null> {
    return await this.model
      .findOne({ ...where, deleted: false })
      .populate('sections')
      .populate({
        path: 'sections',
        populate: ['questions'],
      })
      .exec();
  }

  async findOneWithSections(): Promise<Form | null> {
    return await this.model.findOne({}).populate('sections').exec();
  }

  async findActiveForm(): Promise<Form | null> {
    return await this.model.findOne({ active: true, deleted: false }).exec();
  }

  /**
   * @deprecated Use findActiveGlobalFormFull() or findActivePartnerFormFull() instead
   */
  async findActiveFormFull(): Promise<Form | null> {
    return await this.findActiveGlobalFormFull();
  }

  // --- Scoped queries ---

  async findActiveGlobalForm(): Promise<Form | null> {
    return await this.model
      .findOne({ ownerType: OwnerType.GLOBAL, active: true, deleted: false })
      .exec();
  }

  async findActiveGlobalFormFull(): Promise<Form | null> {
    return await this.model
      .findOne({ ownerType: OwnerType.GLOBAL, active: true, deleted: false })
      .populate({
        path: 'sections',
        match: { active: true, deleted: false },
        populate: {
          path: 'questions',
          match: { active: true, deleted: false },
        },
      })
      .lean()
      .exec();
  }

  async findActivePartnerForm(ownerId: string): Promise<Form | null> {
    return await this.model
      .findOne({
        ownerType: OwnerType.PARTNER,
        ownerId,
        active: true,
        deleted: false,
      })
      .exec();
  }

  async findActivePartnerFormFull(ownerId: string): Promise<Form | null> {
    return await this.model
      .findOne({
        ownerType: OwnerType.PARTNER,
        ownerId,
        active: true,
        deleted: false,
      })
      .populate({
        path: 'sections',
        match: { active: true, deleted: false },
        populate: {
          path: 'questions',
          match: { active: true, deleted: false },
        },
      })
      .lean()
      .exec();
  }

  async findFormBySectionId(sectionId: string): Promise<Form | null> {
    return await this.model
      .findOne({
        sections: new Types.ObjectId(sectionId),
        deleted: false,
      })
      .exec();
  }

  async findByOwner(
    ownerType: OwnerType,
    ownerId?: string,
  ): Promise<Form[]> {
    const filter: Record<string, unknown> = { ownerType, deleted: false };
    if (ownerId) filter.ownerId = ownerId;
    return await this.model.find(filter).exec();
  }
}
