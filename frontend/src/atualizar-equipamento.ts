import type { EquipamentoDetalhado } from './buscar-equipamento';
import { equipamentoValido } from './equipamento';

export interface DadosAtualizacaoEquipamento {
  equipamento: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  patrimonio?: string;
}

type ResultadoAtualizacao =
  | { sucesso: true; equipamento: EquipamentoDetalhado }
  | { sucesso: false; mensagem: string };

const mensagemErroGenerico =
  'Não foi possível atualizar o equipamento. Tente novamente.';

export async function atualizarEquipamento(
  urlApi: string | undefined,
  id: string,
  dados: DadosAtualizacaoEquipamento,
): Promise<ResultadoAtualizacao> {
  try {
    if (!urlApi) return { sucesso: false, mensagem: mensagemErroGenerico };

    const resposta = await fetch(
      `${urlApi.replace(/\/+$/, '')}/equipamentos/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      },
    );

    if (resposta.status === 200) {
      const equipamento: unknown = await resposta.json();
      if (
        equipamentoValido(equipamento) &&
        'criadoEm' in equipamento &&
        typeof equipamento.criadoEm === 'string' &&
        !Number.isNaN(Date.parse(equipamento.criadoEm)) &&
        'atualizadoEm' in equipamento &&
        typeof equipamento.atualizadoEm === 'string' &&
        !Number.isNaN(Date.parse(equipamento.atualizadoEm))
      ) {
        return {
          sucesso: true,
          equipamento: equipamento as EquipamentoDetalhado,
        };
      }
    }

    if (resposta.status === 400) {
      return {
        sucesso: false,
        mensagem:
          'Os dados informados são inválidos. Revise os campos e tente novamente.',
      };
    }

    if (resposta.status === 404) {
      return { sucesso: false, mensagem: 'Equipamento não encontrado.' };
    }

    if (resposta.status === 409) {
      const conflito: unknown = await resposta.json();
      if (
        typeof conflito === 'object' &&
        conflito !== null &&
        'message' in conflito &&
        typeof conflito.message === 'string' &&
        conflito.message.trim() !== ''
      ) {
        return { sucesso: false, mensagem: conflito.message };
      }
    }
  } catch {
    return { sucesso: false, mensagem: mensagemErroGenerico };
  }

  return { sucesso: false, mensagem: mensagemErroGenerico };
}
