import { IsString, Length, ValidateIf } from 'class-validator';

export class CriarEquipamentoDto {
  @IsString()
  @Length(2, 20)
  equipamento!: string;

  @IsString()
  @Length(2, 20)
  marca!: string;

  @IsString()
  @Length(2, 20)
  modelo!: string;

  @IsString()
  @Length(2, 20)
  numeroSerie!: string;

  @ValidateIf((dados: CriarEquipamentoDto) => dados.patrimonio !== undefined)
  @IsString()
  @Length(2, 20)
  patrimonio?: string;
}
