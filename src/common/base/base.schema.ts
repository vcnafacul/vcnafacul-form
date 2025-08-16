import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { now, Types } from 'mongoose';

@Schema()
export class BaseSchema {
  toObject() {
    throw new Error('Method not implemented.');
  }
  @ApiProperty()
  public _id?: Types.ObjectId;

  @Prop({ required: false, default: false, select: false })
  public deleted?: boolean;

  @Prop({ default: () => now(), required: false })
  createdAt?: Date = now();

  @Prop({ default: () => now(), required: false })
  updatedAt?: Date;
}
