import { IsString, Length, ValidateIf } from 'class-validator';

export class AtualizarEquipamentoDto {
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

  @ValidateIf(
    (dados: AtualizarEquipamentoDto) => dados.patrimonio !== undefined,
  )
  @IsString()
  @Length(2, 20)
  patrimonio?: string;
}
