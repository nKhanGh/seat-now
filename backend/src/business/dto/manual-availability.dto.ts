import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';

class ManualCapacityDto {
  @IsInt() @Min(0) total!: number;
  @IsInt() @Min(0) available!: number;
}

export class ManualAvailabilityDto {
  @IsOptional() @ValidateNested() @Type(() => ManualCapacityDto) tables?: ManualCapacityDto;
  @IsOptional() @ValidateNested() @Type(() => ManualCapacityDto) seats?: ManualCapacityDto;
  @IsEnum(['QUIET', 'MODERATE', 'BUSY', 'FULL']) crowdLevel!: 'QUIET' | 'MODERATE' | 'BUSY' | 'FULL';
  @IsOptional() @IsInt() @Min(0) @Max(240) estimatedWaitMinutes?: number;
  @IsBoolean() acceptingGuests!: boolean;
}
