import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateBookingDto {
  @IsDateString() requestedAt!: string;
  @IsInt() @Min(1) @Max(12) guestCount!: number;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
