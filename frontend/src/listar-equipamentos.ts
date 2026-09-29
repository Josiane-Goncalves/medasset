export interface EquipamentoListado {
  id: string;
  equipamento: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  patrimonio?: string | null;
}

function equipamentoValido(valor: unknown): valor is EquipamentoListado {
  if (typeof valor !== 'object' || valor === null) return false;

  const equipamento = valor as Partial<EquipamentoListado>;
  return (
    typeof equipamento.id === 'string' &&
    typeof equipamento.equipamento === 'string' &&
    typeof equipamento.marca === 'string' &&
    typeof equipamento.modelo === 'string' &&
    typeof equipamento.numeroSerie === 'string' &&
    (equipamento.patrimonio == null ||
      typeof equipamento.patrimonio === 'string')
  );
}

export async function listarEquipamentos(
  urlApi: string | undefined,
  sinal: AbortSignal,
): Promise<EquipamentoListado[]> {
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
