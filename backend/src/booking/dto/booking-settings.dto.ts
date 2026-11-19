import { IsBoolean } from 'class-validator';

export class BookingSettingsDto {
  @IsBoolean() enabled!: boolean;
}
