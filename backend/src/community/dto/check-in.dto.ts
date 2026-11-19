import { IsNumber, Max, Min } from 'class-validator';

export class CheckInDto {
  @IsNumber() @Min(-90) @Max(90) lat!: number;
  @IsNumber() @Min(-180) @Max(180) lng!: number;
  @IsNumber() @Min(0) @Max(100) accuracyM!: number;
}
