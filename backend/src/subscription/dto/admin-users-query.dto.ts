import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class AdminUsersQueryDto {
  @IsOptional() @IsString() @MaxLength(80) q?: string;
  @Transform(({ value }: { value: unknown }) => (value === undefined ? 1 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(10000)
  page = 1;
}
