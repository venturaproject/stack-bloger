import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;
}
