import { mixin, NotFoundException, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { GetAllWhereInput } from './interfaces/get-all.input';
import { GetAllOutput } from './interfaces/get-all.output';
import { Form } from 'src/modules/form/form.schema';

export function createRepository<TDoc extends BaseSchema>(schema: Type<TDoc>) {
  class ConcreteRepository extends BaseRepository<TDoc> {
    constructor(@InjectModel(schema.name) model: Model<TDoc>) {
      super(model);
    }
  }
  return mixin(ConcreteRepository);
}

export class BaseRepository<T extends BaseSchema> {
  constructor(public readonly model: Model<T>) {}

  async startSession() {
    return await this.model.startSession();
  }

  async create(item: T, options?: { session?: ClientSession }): Promise<T> {
    const [domain] = await this.model.create([item], options); // já cria e salva, respeitando session
    return domain.toObject() as T;
  }

  async find({ page, limit, where }: GetAllWhereInput): Promise<GetAllOutput<T>> {
    const data = await this.model
      .find()
      .skip((page - 1) * limit)
      .limit(limit ?? Infinity)
      .where({ ...where });
    const totalItems = await this.model.where({ ...where }).countDocuments();
    return {
      data,
      page,
      limit,
      totalItems,
    };
  }

  async findById(_id: string): Promise<T | null> {
    return await this.findOne({ _id });
  }

  async findOne(filtro: object) {
    return await this.model.findOne(filtro);
  }

  async delete(id: string) {
    const existingRecord = await this.model.findOneAndUpdate({ _id: id }, { deleted: true });

    if (!existingRecord) {
      throw new NotFoundException(`Registro com ID ${id} não encontrado.`);
    }
  }

  async updateOne(entity: T, options?: { session?: ClientSession }): Promise<void> {
    await this.model.updateOne({ _id: entity._id }, { $set: entity }, options);
  }

  async updateFields(id: Types.ObjectId, fields: Partial<T>) {
    await this.model.updateOne({ _id: id }, { $set: fields }).exec();
  }

  async getFormFull(id: string): Promise<Form | undefined | null> {
    const form = await this.model
      .findOne({ _id: id })
      .populate({
        path: 'sections',
        match: { active: true }, // só seções ativas
        populate: {
          path: 'questions',
          match: { active: true }, // só questões ativas
        },
      })
      .lean<Form>()
      .exec();

    return form;
  }
}
