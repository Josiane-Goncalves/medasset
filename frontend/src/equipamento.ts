export interface Equipamento {
  id: string;
  equipamento: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  patrimonio?: string | null;
}

export function equipamentoValido(valor: unknown): valor is Equipamento {
  if (typeof valor !== 'object' || valor === null) return false;

  const equipamento = valor as Partial<Equipamento>;
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
