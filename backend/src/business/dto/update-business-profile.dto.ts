import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateBusinessProfileDto {
  @IsString() @MinLength(3) @MaxLength(100) name!: string;
  @IsString() @MinLength(5) @MaxLength(200) address!: string;
  @IsString() @MaxLength(500) description!: string;
  @IsString() @MaxLength(200) openingHours!: string;
  @IsString() @MaxLength(1000) menuSummary!: string;
  @IsInt() @Min(1) @Max(4) priceTier!: number;
}
