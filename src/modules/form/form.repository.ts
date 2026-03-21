import { ForbiddenException, Injectable } from '@nestjs/common';
import { createRepository } from 'src/common/base/base.repository';
import { OwnerContext } from 'src/common/interfaces/owner-context.interface';
import { Form } from './form.schema';
import { Section } from '../section/section.schema';

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

  async findActiveForm(ownerType: string, ownerId: string | null): Promise<Form | null> {
    return await this.model
      .findOne({ active: true, deleted: false, ownerType, ownerId })
      .exec();
  }

  async findActiveFormFull(ownerType: string, ownerId: string | null): Promise<Form | null> {
    return await this.model
      .findOne({ active: true, deleted: false, ownerType, ownerId })
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

  async findByOwner(where: object, ownerContext: OwnerContext): Promise<Form | null> {
    return await this.model
      .findOne({
        ...where,
        deleted: false,
        ownerType: ownerContext.ownerType,
        ownerId: ownerContext.ownerId,
      })
      .populate('sections')
      .populate({
        path: 'sections',
        populate: ['questions'],
      })
      .exec();
  }

  async validateSectionOwnership(
    sectionId: string,
    ownerContext: OwnerContext,
  ): Promise<Section> {
    const form = await this.findActiveForm(ownerContext.ownerType, ownerContext.ownerId);
    if (!form) {
      throw new ForbiddenException('No active form found for this owner');
    }
    const sectionIds = form.sections.map((s: any) => s.toString());
    if (!sectionIds.includes(sectionId)) {
      throw new ForbiddenException('Section does not belong to this owner');
    }
    const formFull = await this.findBy({ _id: form._id });
    const section = formFull?.sections.find(
      (s: any) => s._id.toString() === sectionId,
    );
    if (!section) {
      throw new ForbiddenException('Section not found in owner form');
    }
    return section as Section;
  }
}
