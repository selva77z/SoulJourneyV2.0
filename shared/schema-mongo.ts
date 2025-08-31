import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
}, {
  timestamps: true,
  collection: 'users'
});

// Birth Data Schema
export interface IBirthData extends Document {
  userId: string;
  name: string;
  gender?: string;
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  motherName?: string;
  fatherName?: string;
  gotra?: string;
  rectifiedTime?: string;
  givenTime?: string;
  ayanamsa?: string;
  dayOfWeek?: string;
  sunRise?: string;
  sunSet?: string;
  tithi?: string;
  star?: string;
  starPada?: number;
  rasi?: string;
  lagna?: string;
  lagnaDegreesMinutes?: string;
  hora?: string;
  yogam?: string;
  karana?: string;
  dasaBalance?: string;
  year: number;
  month: number;
  day: number;
  createdAt: Date;
  updatedAt: Date;
}

const BirthDataSchema = new Schema<IBirthData>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  gender: String,
  birthDate: { type: Date, required: true },
  birthTime: { type: String, required: true },
  birthPlace: { type: String, required: true },
  state: String,
  country: String,
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timezone: { type: String, required: true },
  motherName: String,
  fatherName: String,
  gotra: String,
  rectifiedTime: String,
  givenTime: String,
  ayanamsa: String,
  dayOfWeek: String,
  sunRise: String,
  sunSet: String,
  tithi: String,
  star: String,
  starPada: Number,
  rasi: String,
  lagna: String,
  lagnaDegreesMinutes: String,
  hora: String,
  yogam: String,
  karana: String,
  dasaBalance: String,
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  day: { type: Number, required: true },
}, {
  timestamps: true,
  collection: 'birth_data'
});

// Chart Schema
export interface IChart extends Document {
  userId: string;
  birthDataId: string;
  chartType: string;
  chartData: any;
  kpData?: any;
  aiInterpretation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChartSchema = new Schema<IChart>({
  userId: { type: String, required: true },
  birthDataId: { type: String, required: true },
  chartType: { type: String, required: true },
  chartData: { type: Schema.Types.Mixed, required: true },
  kpData: Schema.Types.Mixed,
  aiInterpretation: String,
}, {
  timestamps: true,
  collection: 'charts'
});

// Interpretation Schema
export interface IInterpretation extends Document {
  chartId: string;
  interpretationType: string;
  interpretation: string;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

const InterpretationSchema = new Schema<IInterpretation>({
  chartId: { type: String, required: true },
  interpretationType: { type: String, required: true },
  interpretation: { type: String, required: true },
  confidence: Number,
}, {
  timestamps: true,
  collection: 'interpretations'
});

// Mobile User Schema
export interface IMobileUser extends Document {
  mobileAppId: string;
  deviceId?: string;
  name: string;
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isProcessed: boolean;
  assignedTag?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MobileUserSchema = new Schema<IMobileUser>({
  mobileAppId: { type: String, required: true, unique: true },
  deviceId: String,
  name: { type: String, required: true },
  birthDate: { type: Date, required: true },
  birthTime: { type: String, required: true },
  birthPlace: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  timezone: String,
  isProcessed: { type: Boolean, default: false },
  assignedTag: String,
}, {
  timestamps: true,
  collection: 'mobile_users'
});

// Session Schema
export interface ISession extends Document {
  sid: string;
  sess: any;
  expire: Date;
}

const SessionSchema = new Schema<ISession>({
  sid: { type: String, required: true, unique: true },
  sess: { type: Schema.Types.Mixed, required: true },
  expire: { type: Date, required: true },
}, {
  collection: 'sessions'
});

// Create and export models
export const User = mongoose.model<IUser>('User', UserSchema);
export const BirthData = mongoose.model<IBirthData>('BirthData', BirthDataSchema);
export const Chart = mongoose.model<IChart>('Chart', ChartSchema);
export const Interpretation = mongoose.model<IInterpretation>('Interpretation', InterpretationSchema);
export const MobileUser = mongoose.model<IMobileUser>('MobileUser', MobileUserSchema);
export const Session = mongoose.model<ISession>('Session', SessionSchema);
