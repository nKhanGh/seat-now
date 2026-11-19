import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateParkingSnapshotDto {
  @IsInt() @Min(1) version!: number;
  @IsOptional() @IsInt() @Min(0) availableSpaces?: number | null;
  @IsOptional() @IsInt() @Min(0) totalSpaces?: number | null;
  @IsEnum(['DEMO', 'OPERATOR', 'SENSOR']) source!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) sourceRecordId!: string;
  @IsNumber() @Min(0) @Max(1) confidence!: number;
  @IsISO8601() capturedAt!: string;
  @IsISO8601() expiresAt!: string;
}
