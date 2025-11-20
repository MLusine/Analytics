import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  sessionId: string;
  eventType: 'click' | 'scroll' | 'mutation' | 'snapshot';
  timestamp: number;
  data: any; // JSON event details
  pageUrl: string;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>({
  sessionId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, enum: ['click', 'scroll', 'mutation', 'snapshot'] },
  timestamp: { type: Number, required: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  pageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);

