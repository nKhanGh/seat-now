import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

class CapacityDto {
  @IsInt() @Min(0) total!: number;
  @IsInt() @Min(0) available!: number;
}

export class CreateAvailabilityDto {
  @IsInt() @Min(1) version!: number;
  @IsOptional() @ValidateNested() @Type(() => CapacityDto) tables?: CapacityDto | null;
  @IsOptional() @ValidateNested() @Type(() => CapacityDto) seats?: CapacityDto | null;
  @IsEnum(['QUIET', 'MODERATE', 'BUSY', 'FULL', 'UNKNOWN']) crowdLevel!: string;
  @IsOptional() @IsInt() @Min(0) @Max(240) estimatedWaitMinutes?: number | null;
  @IsBoolean() acceptingGuests!: boolean;
  @IsEnum(['DEMO', 'OPERATOR', 'POS']) source!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) sourceRecordId!: string;
  @IsNumber() @Min(0) @Max(1) confidence!: number;
  @IsISO8601() capturedAt!: string;
  @IsISO8601() expiresAt!: string;
}
