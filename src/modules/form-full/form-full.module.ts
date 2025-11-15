import { MongooseModule } from '@nestjs/mongoose';
import { FormFullRepository } from './form-full.repository';
import formFullSchema, { FormFull } from './schema/form-full.schema';
import { Module } from '@nestjs/common';
import { FormFullController } from './form-full.controller';
import { FormFullService } from './formfull.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: FormFull.name, schema: formFullSchema }])],
  providers: [FormFullRepository, FormFullService],
  controllers: [FormFullController],
  exports: [FormFullRepository, FormFullService],
})
export class FormFullModule {}
