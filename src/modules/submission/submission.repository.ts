import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { createRepository } from 'src/common/base/base.repository';
import { Submission } from './submission.schema';

@Injectable()
export class SubmissionRepository extends createRepository(Submission) {
  async findById(id: string): Promise<Submission | null> {
    if (!Types.ObjectId.isValid(id)) {
      // ID inválido → trata como "não encontrado"
      return null;
    }
    return await this.model.findById(id).exec();
  }

  async findByUsersId(userIds: string[], form: Types.ObjectId): Promise<Submission[]> {
    return await this.model
      .find({
        userId: { $in: userIds },
        form,
      })
      .lean();
  }
}
