import { IsIn } from 'class-validator';

export class ResolveBookingDto {
  @IsIn(['CONFIRMED', 'DECLINED', 'COMPLETED']) status!: 'CONFIRMED' | 'DECLINED' | 'COMPLETED';
}
