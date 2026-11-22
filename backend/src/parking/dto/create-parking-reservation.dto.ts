import { IsEnum, IsISO8601 } from 'class-validator';

export class CreateParkingReservationDto {
  @IsEnum(['CAR', 'MOTORBIKE']) vehicleType!: 'CAR' | 'MOTORBIKE';
  @IsISO8601() startsAt!: string;
  @IsISO8601() endsAt!: string;
}
