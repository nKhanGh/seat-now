import { IsString, Matches } from 'class-validator';

export class RedeemVoucherDto {
  @IsString() @Matches(/^SN-[A-F0-9]{12}$/) code!: string;
}
