export class ErroEquipamentoNaoEncontrado extends Error {
  constructor() {
    super('Equipamento não encontrado.');
    this.name = 'ErroEquipamentoNaoEncontrado';
  }
}
