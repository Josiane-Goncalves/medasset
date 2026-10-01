import type { Equipamento } from '../gerado/prisma/client';

export interface DadosCadastroEquipamento {
  equipamento: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  patrimonio?: string;
}

export type DadosAtualizacaoEquipamento = DadosCadastroEquipamento;

export class ErroUnicidadePersistencia extends Error {}

export abstract class EquipamentosRepository {
  abstract listar(): Promise<Equipamento[]>;
  abstract buscarPorId(id: string): Promise<Equipamento | null>;
  abstract buscarPorNumeroSerie(
    numeroSerie: string,
  ): Promise<Equipamento | null>;
  abstract buscarPorPatrimonio(patrimonio: string): Promise<Equipamento | null>;
  abstract criar(dados: DadosCadastroEquipamento): Promise<Equipamento>;
  abstract atualizar(
    id: string,
    dados: DadosAtualizacaoEquipamento,
  ): Promise<Equipamento>;
}
