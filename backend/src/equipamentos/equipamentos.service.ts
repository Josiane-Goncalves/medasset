import { Injectable } from '@nestjs/common';
import { ErroConflitoEquipamento } from './erro-conflito-equipamento';
import { ErroEquipamentoNaoEncontrado } from './erro-equipamento-nao-encontrado';
import {
  DadosCadastroEquipamento,
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

  private async verificarDuplicidade(dados: DadosCadastroEquipamento) {
    const equipamentoComNumeroSerie =
      await this.equipamentosRepository.buscarPorNumeroSerie(dados.numeroSerie);
    const equipamentoComPatrimonio =
      dados.patrimonio !== undefined
        ? await this.equipamentosRepository.buscarPorPatrimonio(
            dados.patrimonio,
          )
        : null;

    if (equipamentoComNumeroSerie && equipamentoComPatrimonio) {
      throw new ErroConflitoEquipamento('NUMERO_SERIE_E_PATRIMONIO');
    }

    if (equipamentoComNumeroSerie) {
      throw new ErroConflitoEquipamento('NUMERO_SERIE');
    }

    if (equipamentoComPatrimonio) {
      throw new ErroConflitoEquipamento('PATRIMONIO');
    }
  }
}
