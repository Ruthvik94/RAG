import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  mimetype!: string;

  @IsNumber()
  @IsNotEmpty()
  size!: number;

  @IsString()
  @IsNotEmpty()
  path!: string;
}