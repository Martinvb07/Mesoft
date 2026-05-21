import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Counter } from './schemas/counter.schema';

@Injectable()
export class IdService {
  constructor(@InjectModel(Counter.name) private readonly counters: Model<Counter>) {}

  async next(entityName: string): Promise<number> {
    const doc = await this.counters
      .findOneAndUpdate(
        { _id: entityName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean<{ _id: string; seq: number }>()
      .exec();

    return Number(doc.seq);
  }
}
