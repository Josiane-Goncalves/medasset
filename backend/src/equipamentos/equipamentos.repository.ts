import type { Equipamento } from '../gerado/prisma/client';

export interface DadosCadastroEquipamento {
  equipamento: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  patrimonio?: string;
}

export class ErroUnicidadePersistencia extends Error {}

export abstract class EquipamentosRepository {
  abstract listar(): Promise<Equipamento[]>;
  abstract buscarPorNumeroSerie(
    numeroSerie: string,
  ): Promise<Equipamento | null>;
  abstract buscarPorPatrimonio(patrimonio: string): Promise<Equipamento | null>;
  abstract criar(dados: DadosCadastroEquipamento): Promise<Equipamento>;
}
