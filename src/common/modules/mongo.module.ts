import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        if (process.env.NODE_ENV === 'test') {
          const mongod = await MongoMemoryServer.create();
          const uri = mongod.getUri();
          return {
            uri,
          };
        }
        return {
          uri: process.env.MONGODB,
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
        };
      },
    }),
  ],
})
export class MongoModule {}
