import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const toNumber = ({ value }: { value: unknown }) => (value === undefined ? undefined : Number(value));

export class MapQueryDto {
  @Transform(toNumber)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Transform(toNumber)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @Transform(toNumber)
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(20_000)
  radiusM = 3000;

  @IsOptional()
  @IsEnum(['RESTAURANT', 'CAFE', 'CINEMA'])
  category?: 'RESTAURANT' | 'CAFE' | 'CINEMA';

  @IsOptional()
  @IsEnum(['VIETNAMESE', 'WESTERN', 'COFFEE', 'DESSERT'])
  cuisine?: 'VIETNAMESE' | 'WESTERN' | 'COFFEE' | 'DESSERT';

  @Transform(toNumber)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  priceTier?: number;

  @Transform(toNumber)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  ratingGte?: number;

  @IsOptional()
  @IsEnum(['QUIET', 'MODERATE', 'BUSY', 'FULL'])
  crowdLevel?: string;

  @IsOptional()
  @IsEnum(['true', 'false'])
  hasAvailability?: string;

  @IsOptional()
  @IsEnum(['true', 'false'])
  adsHidden?: string;

  @Transform(toNumber)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;
}
