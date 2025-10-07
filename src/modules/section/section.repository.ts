import { Injectable } from '@nestjs/common';
import { createRepository } from 'src/common/base/base.repository';
import { Section } from './section.schema';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { GetAllWhereInput } from 'src/common/base/interfaces/get-all.input';

@Injectable()
export class SectionRepository extends createRepository(Section) {
  async findById(id: string): Promise<Section | null> {
    return await this.model.findOne({ _id: id }).populate('questions').exec();
  }

  async find({ page, limit, where }: GetAllWhereInput): Promise<GetAllOutput<Section>> {
    const data = await this.model
      .find()
      .skip((page - 1) * limit)
      .limit(limit ?? Infinity)
      .populate('questions')
      .where({ ...where });
    const totalItems = await this.model.where({ ...where }).countDocuments();
    return {
      data,
      page,
      limit,
      totalItems,
    };
  }
}
