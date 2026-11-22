import { IsInt, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateVoucherOfferDto {
  @IsString() @Matches(/^[a-z0-9-]{3,100}$/) venueSlug!: string;
  @IsString() @MinLength(5) @MaxLength(100) title!: string;
  @IsString() @MinLength(3) @MaxLength(100) discountText!: string;
  @IsInt() @Min(1) @Max(1000) stock!: number;
  @IsInt() @Min(1) @Max(30) days!: number;
}
