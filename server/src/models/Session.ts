import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  eventCount: number;
  userAgent: string;
  deviceInfo: {
    screenWidth: number;
    screenHeight: number;
    timezone: string;
  };
  screenResolution: string;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date },
  eventCount: { type: Number, default: 0 },
  userAgent: { type: String, required: true },
  deviceInfo: {
    screenWidth: { type: Number, required: true },
    screenHeight: { type: Number, required: true },
    timezone: { type: String, required: true },
  },
  screenResolution: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Session = mongoose.model<ISession>('Session', SessionSchema);

