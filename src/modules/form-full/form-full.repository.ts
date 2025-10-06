import { Injectable } from '@nestjs/common';
import { FormFull } from './schema/form-full.schema';
import { createRepository } from 'src/common/base/base.repository';

@Injectable()
export class FormFullRepository extends createRepository(FormFull) {}
