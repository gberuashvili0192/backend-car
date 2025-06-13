import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
class BasicInfo {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;
}

@Schema()
class Coordinates {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

@Schema()
class Location {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ type: Coordinates, required: true })
  coordinates: Coordinates;
}

@Schema()
class Service {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  duration: string;

  @Prop({ required: false })
  description: string;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema()
class WorkingHoursPeriod {
  @Prop({ required: true })
  isOpen: boolean;

  @Prop()
  from: string;

  @Prop()
  to: string;
}

@Schema()
class WorkingHours {
  @Prop({ type: WorkingHoursPeriod, required: true })
  monday: WorkingHoursPeriod;

  @Prop({ type: WorkingHoursPeriod, required: true })
  tuesday: WorkingHoursPeriod;

  @Prop({ type: WorkingHoursPeriod, required: true })
  wednesday: WorkingHoursPeriod;

  @Prop({ type: WorkingHoursPeriod, required: true })
  thursday: WorkingHoursPeriod;

  @Prop({ type: WorkingHoursPeriod, required: true })
  friday: WorkingHoursPeriod;

  @Prop({ type: WorkingHoursPeriod, required: true })
  saturday: WorkingHoursPeriod;

  @Prop({ type: WorkingHoursPeriod, required: true })
  sunday: WorkingHoursPeriod;
}

@Schema({ timestamps: true })
export class Carwash {
  @Prop({ type: BasicInfo, required: true })
  basicInfo: BasicInfo;

  @Prop({ type: Location, required: true })
  location: Location;

  @Prop({ type: [Service], default: [] })
  services: Service[];

  @Prop({ type: WorkingHours, required: true })
  workingHours: WorkingHours;

  @Prop({ default: true })
  isActive: boolean;
}

export type CarwashDocument = Carwash & Document;
export const CarwashSchema = SchemaFactory.createForClass(Carwash);
