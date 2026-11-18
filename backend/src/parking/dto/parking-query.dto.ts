import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

const toNumber = ({ value }: { value: unknown }) => value === undefined ? undefined : Number(value);

export class ParkingQueryDto {
  @Transform(toNumber) @IsOptional() @IsNumber() @Min(-90) @Max(90) lat?: number;
  @Transform(toNumber) @IsOptional() @IsNumber() @Min(-180) @Max(180) lng?: number;
  @Transform(toNumber) @IsOptional() @IsInt() @Min(100) @Max(5000) radiusM = 1500;
  @IsOptional() @IsEnum(['CAR', 'MOTORBIKE']) vehicleType?: string;
  @IsOptional() @IsEnum(['true', 'false']) hasAvailability?: string;
}
