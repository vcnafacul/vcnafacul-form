import { MongooseModule } from '@nestjs/mongoose';
import { FormFullRepository } from './form-full.repository';
import formFullSchema, { FormFull } from './schema/form-full.schema';
import { Module } from '@nestjs/common';

@Module({
  imports: [MongooseModule.forFeature([{ name: FormFull.name, schema: formFullSchema }])],
  providers: [FormFullRepository],
  controllers: [],
  exports: [FormFullRepository],
})
export class FormFullModule {}
