import { IsEmail } from 'class-validator';

export class RevokeDemoPremiumDto {
  @IsEmail() email!: string;
}
