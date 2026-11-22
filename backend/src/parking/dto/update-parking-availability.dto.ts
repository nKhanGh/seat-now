import { IsInt, Min } from 'class-validator';

export class UpdateParkingAvailabilityDto {
  @IsInt() @Min(0) totalSpaces!: number;
  @IsInt() @Min(0) availableSpaces!: number;
}
