import {
  IsArray,
  ArrayMaxSize,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVenueProposalDto {
  @IsString() @MinLength(3) @MaxLength(100) name!: string;
  @IsEnum(['RESTAURANT', 'CAFE', 'CINEMA']) category!: 'RESTAURANT' | 'CAFE' | 'CINEMA';
  @IsArray()
  @ArrayMaxSize(4)
  @IsEnum(['VIETNAMESE', 'WESTERN', 'COFFEE', 'DESSERT'], { each: true })
  cuisineTypes!: string[];
  @IsString() @MinLength(10) @MaxLength(500) description!: string;
  @IsString() @MinLength(5) @MaxLength(200) address!: string;
  @IsNumber() @Min(-90) @Max(90) lat!: number;
  @IsNumber() @Min(-180) @Max(180) lng!: number;
  @IsInt() @Min(1) @Max(4) priceTier!: number;
}

export class ProposalQueryDto {
  @IsOptional() @IsEnum(['PENDING', 'READY_FOR_REVIEW']) status?: string;
}
