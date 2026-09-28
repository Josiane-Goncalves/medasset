export type MotivoConflitoEquipamento =
  'NUMERO_SERIE' | 'PATRIMONIO' | 'NUMERO_SERIE_E_PATRIMONIO';

const mensagensConflito: Record<MotivoConflitoEquipamento, string> = {
  NUMERO_SERIE: 'Já existe um equipamento cadastrado com este número de série.',
  PATRIMONIO: 'Já existe um equipamento cadastrado com este patrimônio.',
  NUMERO_SERIE_E_PATRIMONIO:
    'Já existe equipamento cadastrado com o número de série e o patrimônio informados.',
};

export class ErroConflitoEquipamento extends Error {
  constructor(public readonly motivo: MotivoConflitoEquipamento) {
    super(mensagensConflito[motivo]);
    this.name = 'ErroConflitoEquipamento';
  }
}
