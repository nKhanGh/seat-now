import { IsIn } from 'class-validator';

export class ResolveBookingDto {
  @IsIn(['CONFIRMED', 'DECLINED']) status!: 'CONFIRMED' | 'DECLINED';
}
