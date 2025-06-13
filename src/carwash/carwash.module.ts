import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarwashController } from './carwash.controller';
import { CarwashService } from './carwash.service';
import { Carwash, CarwashSchema } from './schemas/carwash.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Carwash.name, schema: CarwashSchema }]),
  ],
  controllers: [CarwashController],
  providers: [CarwashService],
  exports: [CarwashService],
})
export class CarwashModule {}
