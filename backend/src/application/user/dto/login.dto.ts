import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  login: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}
