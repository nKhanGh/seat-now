import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class RecommendationQueryDto {
  @Type(() => Number) @IsNumber() @Min(-90) @Max(90) lat!: number;
  @Type(() => Number) @IsNumber() @Min(-180) @Max(180) lng!: number;
  @IsOptional() @IsEnum(['VIETNAMESE', 'WESTERN', 'COFFEE', 'DESSERT']) cuisine?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(4) maxPriceTier?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) partySize?: number;
}
