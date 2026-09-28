export interface DadosCadastroEquipamento {
  equipamento: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  patrimonio?: string;
}

type ResultadoCadastro =
  { sucesso: true } | { sucesso: false; mensagem: string };

const mensagemErroGenerico =
  'Não foi possível cadastrar o equipamento. Tente novamente.';

export async function cadastrarEquipamento(
  urlApi: string | undefined,
  dados: DadosCadastroEquipamento,
): Promise<ResultadoCadastro> {
  try {
    if (!urlApi) {
      return { sucesso: false, mensagem: mensagemErroGenerico };
    }

    const resposta = await fetch(`${urlApi.replace(/\/+$/, '')}/equipamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    if (resposta.status === 201) {
      return { sucesso: true };
    }

    if (resposta.status === 400) {
      return {
        sucesso: false,
        mensagem:
          'Os dados informados são inválidos. Revise os campos e tente novamente.',
      };
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
