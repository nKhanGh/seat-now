import { IsBoolean, IsISO8601, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCampaignDto {
  @IsString() @MinLength(10) @MaxLength(200) promotionText!: string;
  @IsISO8601() startsAt!: string;
  @IsISO8601() endsAt!: string;
  @IsBoolean() sponsored!: boolean;
}
