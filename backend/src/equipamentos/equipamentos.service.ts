import { Injectable } from '@nestjs/common';
import { ErroConflitoEquipamento } from './erro-conflito-equipamento';
import { ErroEquipamentoNaoEncontrado } from './erro-equipamento-nao-encontrado';
import {
  DadosCadastroEquipamento,
  DadosAtualizacaoEquipamento,
  EquipamentosRepository,
  ErroUnicidadePersistencia,
} from './equipamentos.repository';

@Injectable()
export class EquipamentosService {
  constructor(
    private readonly equipamentosRepository: EquipamentosRepository,
  ) {}

  listarEquipamentos() {
    return this.equipamentosRepository.listar();
  }

  async buscarEquipamentoPorId(id: string) {
    const equipamento = await this.equipamentosRepository.buscarPorId(id);

    if (equipamento === null) {
      throw new ErroEquipamentoNaoEncontrado();
    }

    return equipamento;
  }

  async cadastrarEquipamento(dados: DadosCadastroEquipamento) {
    await this.verificarDuplicidade(dados);

    try {
      return await this.equipamentosRepository.criar(dados);
    } catch (erro) {
      if (erro instanceof ErroUnicidadePersistencia) {
        await this.verificarDuplicidade(dados);
      }

      throw erro;
    }
  }

  async atualizarEquipamento(id: string, dados: DadosAtualizacaoEquipamento) {
    const equipamento = await this.buscarEquipamentoPorId(id);
    await this.verificarDuplicidade(dados, equipamento.id);

    try {
      return await this.equipamentosRepository.atualizar(id, dados);
    } catch (erro) {
      if (erro instanceof ErroUnicidadePersistencia) {
        await this.verificarDuplicidade(dados, equipamento.id);
      }

      throw erro;
    }
  }

  async excluirEquipamento(id: string): Promise<void> {
    await this.buscarEquipamentoPorId(id);
    await this.equipamentosRepository.excluir(id);
  }

  private async verificarDuplicidade(
    dados: DadosCadastroEquipamento,
    idIgnorado?: string,
  ) {
    const equipamentoComNumeroSerie =
      await this.equipamentosRepository.buscarPorNumeroSerie(dados.numeroSerie);
    const equipamentoComPatrimonio =
      dados.patrimonio !== undefined
        ? await this.equipamentosRepository.buscarPorPatrimonio(
            dados.patrimonio,
          )
        : null;

    const numeroSerieDuplicado =
      equipamentoComNumeroSerie !== null &&
      equipamentoComNumeroSerie.id !== idIgnorado;
    const patrimonioDuplicado =
      equipamentoComPatrimonio !== null &&
      equipamentoComPatrimonio.id !== idIgnorado;

    if (numeroSerieDuplicado && patrimonioDuplicado) {
      throw new ErroConflitoEquipamento('NUMERO_SERIE_E_PATRIMONIO');
    }

    if (numeroSerieDuplicado) {
      throw new ErroConflitoEquipamento('NUMERO_SERIE');
    }

    if (patrimonioDuplicado) {
      throw new ErroConflitoEquipamento('PATRIMONIO');
    }
  }
}
