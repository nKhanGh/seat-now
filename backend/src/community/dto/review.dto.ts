import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpsertReviewDto {
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString() @MinLength(10) @MaxLength(500) body!: string;
}

export class ReviewQueryDto {
  @IsOptional() @IsString() @Matches(/^[A-Za-z0-9_-]{1,512}$/) cursor?: string;
}
