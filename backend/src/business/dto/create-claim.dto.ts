import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateClaimDto {
  @IsString() @MinLength(20) @MaxLength(300) evidence!: string;
}
