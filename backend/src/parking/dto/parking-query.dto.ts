import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const toNumber = ({ value }: { value: unknown }) => (value === undefined ? undefined : Number(value));

export class ParkingQueryDto {
  @Transform(toNumber) @IsOptional() @IsNumber() @Min(-90) @Max(90) lat?: number;
  @Transform(toNumber) @IsOptional() @IsNumber() @Min(-180) @Max(180) lng?: number;
  @Transform(toNumber) @IsOptional() @IsInt() @Min(100) @Max(5000) radiusM = 1500;
  @IsOptional() @IsEnum(['CAR', 'MOTORBIKE']) vehicleType?: string;
  @IsOptional() @IsEnum(['true', 'false']) hasAvailability?: string;
  @IsOptional() @IsEnum(['true', 'false']) open24h?: string;
  @IsOptional() @IsEnum(['true', 'false']) freeOnly?: string;
  @Transform(toNumber) @IsOptional() @IsInt() @Min(1) @Max(50) limit?: number;
  @IsOptional() @IsString() @Matches(/^[A-Za-z0-9_-]{1,512}$/) cursor?: string;
}
