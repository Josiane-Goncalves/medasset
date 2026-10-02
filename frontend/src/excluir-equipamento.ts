type ResultadoExclusao =
  { sucesso: true } | { sucesso: false; mensagem: string };

const mensagemErroGenerico =
  'Não foi possível excluir o equipamento. Tente novamente.';

export async function excluirEquipamento(
  urlApi: string | undefined,
  id: string,
): Promise<ResultadoExclusao> {
  try {
    if (!urlApi) return { sucesso: false, mensagem: mensagemErroGenerico };

    const resposta = await fetch(
      `${urlApi.replace(/\/+$/, '')}/equipamentos/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );

    if (resposta.status === 204) return { sucesso: true };
    if (resposta.status === 404) {
      return { sucesso: false, mensagem: 'Equipamento não encontrado.' };
    }
  } catch {
    return { sucesso: false, mensagem: mensagemErroGenerico };
  }

  return { sucesso: false, mensagem: mensagemErroGenerico };
}
