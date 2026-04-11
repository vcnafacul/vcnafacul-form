import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { createRepository } from 'src/common/base/base.repository';
import { Section } from './section.schema';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { GetAllInput, GetAllWhereInput } from 'src/common/base/interfaces/get-all.input';

@Injectable()
export class SectionRepository extends createRepository(Section) implements OnModuleInit {
  private readonly logger = new Logger(SectionRepository.name);

  async onModuleInit(): Promise<void> {
    // Remove legacy unique index on `name` (name_1). Section names are no
    // longer globally unique — they may repeat across different forms.
    try {
      await this.model.collection.dropIndex('name_1');
      this.logger.log('Dropped legacy unique index sections.name_1');
    } catch (err: any) {
      if (err?.codeName !== 'IndexNotFound' && err?.code !== 27) {
        this.logger.warn(`Failed to drop sections.name_1 index: ${err?.message ?? err}`);
      }
    }
  }

  async findById(id: string): Promise<Section | null> {
    return await this.model.findOne({ _id: id }).populate('questions').exec();
  }

  async find({ page, limit, where }: GetAllWhereInput): Promise<GetAllOutput<Section>> {
    const data = await this.model
      .find()
      .skip((page - 1) * limit)
      .limit(limit ?? Infinity)
      .populate('questions')
      .where({ ...where, deleted: false })
      .exec();
    const totalItems = await this.model.where({ ...where }).countDocuments();
    return {
      data,
      page,
      limit,
      totalItems,
    };
  }

  async findByIds(
    ids: string[],
    { page, limit }: GetAllInput,
  ): Promise<GetAllOutput<Section>> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const filter = { _id: { $in: objectIds }, deleted: false };
    const data = await this.model
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit ?? Infinity)
      .populate('questions')
      .exec();
    const totalItems = await this.model.countDocuments(filter);
    return { data, page, limit, totalItems };
  }
}
