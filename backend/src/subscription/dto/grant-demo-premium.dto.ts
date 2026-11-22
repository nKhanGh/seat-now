import { IsEmail, IsInt, Max, Min } from 'class-validator';

export class GrantDemoPremiumDto {
  @IsEmail() email!: string;
  @IsInt() @Min(1) @Max(30) days!: number;
}
