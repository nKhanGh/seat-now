import { IsEnum, IsISO8601, IsOptional } from 'class-validator';

export class SetBusinessPlanDto {
  @IsEnum(['FREE', 'PREMIUM']) plan!: 'FREE' | 'PREMIUM';
  @IsOptional() @IsISO8601() premiumExpiresAt?: string;
}
