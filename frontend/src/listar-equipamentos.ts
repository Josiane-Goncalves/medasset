import { equipamentoValido, type Equipamento } from './equipamento';

export async function listarEquipamentos(
  urlApi: string | undefined,
  sinal: AbortSignal,
): Promise<Equipamento[]> {
  if (!urlApi) throw new Error('URL da API nao configurada.');

  const resposta = await fetch(`${urlApi.replace(/\/+$/, '')}/equipamentos`, {
    method: 'GET',
    signal: sinal,
  });

  if (resposta.status !== 200) throw new Error('Falha ao listar equipamentos.');

  const equipamentos: unknown = await resposta.json();
  if (!Array.isArray(equipamentos) || !equipamentos.every(equipamentoValido)) {
    throw new Error('Resposta de listagem invalida.');
  }

  return equipamentos;
}
