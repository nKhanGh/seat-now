import { IsEnum } from 'class-validator';

export class ReportReviewDto {
  @IsEnum(['SPAM', 'ABUSE', 'OTHER']) reason!: 'SPAM' | 'ABUSE' | 'OTHER';
}
