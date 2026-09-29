import { equipamentoValido, type Equipamento } from './equipamento';

export interface EquipamentoDetalhado extends Equipamento {
  criadoEm: string;
  atualizadoEm: string;
}

export async function buscarEquipamentoPorId(
  urlApi: string | undefined,
  id: string,
  sinal: AbortSignal,
): Promise<EquipamentoDetalhado | null> {
  if (!urlApi) throw new Error('URL da API nao configurada.');

  const resposta = await fetch(
    `${urlApi.replace(/\/+$/, '')}/equipamentos/${encodeURIComponent(id)}`,
    { method: 'GET', signal: sinal },
  );

  if (resposta.status === 404) return null;
  if (resposta.status !== 200) throw new Error('Falha ao buscar equipamento.');

  const equipamento: unknown = await resposta.json();
  if (
    !equipamentoValido(equipamento) ||
    !('criadoEm' in equipamento) ||
    typeof equipamento.criadoEm !== 'string' ||
    Number.isNaN(Date.parse(equipamento.criadoEm)) ||
    !('atualizadoEm' in equipamento) ||
    typeof equipamento.atualizadoEm !== 'string' ||
    Number.isNaN(Date.parse(equipamento.atualizadoEm))
  ) {
    throw new Error('Resposta de equipamento invalida.');
  }

  return equipamento as EquipamentoDetalhado;
}
