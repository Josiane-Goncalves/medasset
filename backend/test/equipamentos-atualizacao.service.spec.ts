import type { Equipamento } from '../src/gerado/prisma/client';
import {
  DadosAtualizacaoEquipamento,
  EquipamentosRepository,
  ErroUnicidadePersistencia,
} from '../src/equipamentos/equipamentos.repository';
import { EquipamentosService } from '../src/equipamentos/equipamentos.service';
import { ErroConflitoEquipamento } from '../src/equipamentos/erro-conflito-equipamento';
import { ErroEquipamentoNaoEncontrado } from '../src/equipamentos/erro-equipamento-nao-encontrado';

describe('Atualizacao de equipamentos', () => {
  let repositorio: jest.Mocked<EquipamentosRepository>;
  let servico: EquipamentosService;
  const equipamento: Equipamento = {
    id: 'aaaaaaaa-0000-4000-8000-000000000001',
    equipamento: 'Monitor',
    marca: 'Marca',
    modelo: 'Modelo',
    numeroSerie: 'SERIE-01',
    patrimonio: 'PAT-01',
    criadoEm: new Date('2026-09-28T12:00:00Z'),
    atualizadoEm: new Date('2026-09-28T12:00:00Z'),
  };
  const dados: DadosAtualizacaoEquipamento = {
    equipamento: 'Ventilador',
    marca: 'Outra marca',
    modelo: 'Outro modelo',
    numeroSerie: 'SERIE-02',
    patrimonio: 'PAT-02',
  };
  const equipamentoAtualizado: Equipamento = {
    ...equipamento,
    ...dados,
    atualizadoEm: new Date('2026-09-30T12:00:00Z'),
  };
  const outroComNumeroSerie = {
    ...equipamento,
    id: 'aaaaaaaa-0000-4000-8000-000000000002',
    numeroSerie: dados.numeroSerie,
    patrimonio: 'PAT-03',
  };
  const outroComPatrimonio = {
    ...equipamento,
    id: 'aaaaaaaa-0000-4000-8000-000000000003',
    numeroSerie: 'SERIE-03',
    patrimonio: dados.patrimonio ?? null,
  };

  beforeEach(() => {
    repositorio = {
      listar: jest.fn(),
      buscarPorId: jest.fn().mockResolvedValue(equipamento),
      buscarPorNumeroSerie: jest.fn().mockResolvedValue(null),
      buscarPorPatrimonio: jest.fn().mockResolvedValue(null),
      criar: jest.fn(),
      atualizar: jest.fn().mockResolvedValue(equipamentoAtualizado),
    };
    servico = new EquipamentosService(repositorio);
  });

  it('atualiza o equipamento existente pelo ID e retorna o registro atualizado', async () => {
    await expect(
      servico.atualizarEquipamento(equipamento.id, dados),
    ).resolves.toEqual(equipamentoAtualizado);
    expect(repositorio.buscarPorId).toHaveBeenCalledWith(equipamento.id);
    expect(repositorio.atualizar).toHaveBeenCalledWith(equipamento.id, dados);
  });

  it('rejeita equipamento inexistente sem tentar persistir', async () => {
    repositorio.buscarPorId.mockResolvedValue(null);

    await expect(
      servico.atualizarEquipamento(equipamento.id, dados),
    ).rejects.toBeInstanceOf(ErroEquipamentoNaoEncontrado);
    expect(repositorio.atualizar).not.toHaveBeenCalled();
  });

  it('permite manter numero de serie e patrimonio do proprio registro', async () => {
    const dadosMantidos = {
      ...dados,
      numeroSerie: equipamento.numeroSerie,
      patrimonio: equipamento.patrimonio ?? undefined,
    };
    const atualizado = {
      ...equipamento,
      ...dadosMantidos,
      patrimonio: equipamento.patrimonio,
    };
    repositorio.buscarPorNumeroSerie.mockResolvedValue(equipamento);
    repositorio.buscarPorPatrimonio.mockResolvedValue(equipamento);
    repositorio.atualizar.mockResolvedValue(atualizado);

    await expect(
      servico.atualizarEquipamento(equipamento.id.toUpperCase(), dadosMantidos),
    ).resolves.toEqual(atualizado);
    expect(repositorio.atualizar).toHaveBeenCalledWith(
      equipamento.id.toUpperCase(),
      dadosMantidos,
    );
  });

  it('retorna equipamento sem patrimonio quando omitido, sem consultar duplicidade desse campo', async () => {
    const dadosSemPatrimonio = { ...dados };
    delete dadosSemPatrimonio.patrimonio;
    const atualizado = {
      ...equipamentoAtualizado,
      patrimonio: null,
    };
    repositorio.atualizar.mockResolvedValue(atualizado);

    await expect(
      servico.atualizarEquipamento(equipamento.id, dadosSemPatrimonio),
    ).resolves.toEqual(atualizado);
    expect(repositorio.buscarPorPatrimonio).not.toHaveBeenCalled();
    expect(repositorio.atualizar).toHaveBeenCalledWith(
      equipamento.id,
      dadosSemPatrimonio,
    );
  });

  const conflitos = [
    {
      descricao: 'numero de serie',
      motivo: 'NUMERO_SERIE',
      numeroSerieDuplicado: true,
      patrimonioDuplicado: false,
    },
    {
      descricao: 'patrimonio',
      motivo: 'PATRIMONIO',
      numeroSerieDuplicado: false,
      patrimonioDuplicado: true,
    },
    {
      descricao: 'ambos em outros registros',
      motivo: 'NUMERO_SERIE_E_PATRIMONIO',
      numeroSerieDuplicado: true,
      patrimonioDuplicado: true,
    },
  ];

  it.each(conflitos)(
    'rejeita $descricao sem persistir e ignora identificadores do proprio registro',
    async ({ motivo, numeroSerieDuplicado, patrimonioDuplicado }) => {
      const novosDados = {
        ...dados,
        numeroSerie: numeroSerieDuplicado
          ? dados.numeroSerie
          : equipamento.numeroSerie,
        patrimonio: patrimonioDuplicado
          ? dados.patrimonio
          : (equipamento.patrimonio ?? undefined),
      };
      repositorio.buscarPorNumeroSerie.mockResolvedValue(
        numeroSerieDuplicado ? outroComNumeroSerie : equipamento,
      );
      repositorio.buscarPorPatrimonio.mockResolvedValue(
        patrimonioDuplicado ? outroComPatrimonio : equipamento,
      );

      const atualizacao = servico.atualizarEquipamento(
        equipamento.id,
        novosDados,
      );

      await expect(atualizacao).rejects.toBeInstanceOf(ErroConflitoEquipamento);
      await expect(atualizacao).rejects.toHaveProperty('motivo', motivo);
      expect(repositorio.atualizar).not.toHaveBeenCalled();
    },
  );

  it.each(conflitos)(
    'identifica conflito concorrente de $descricao durante a atualizacao',
    async ({ motivo, numeroSerieDuplicado, patrimonioDuplicado }) => {
      const novosDados = {
        ...dados,
        numeroSerie: numeroSerieDuplicado
          ? dados.numeroSerie
          : equipamento.numeroSerie,
        patrimonio: patrimonioDuplicado
          ? dados.patrimonio
          : (equipamento.patrimonio ?? undefined),
      };
      repositorio.buscarPorNumeroSerie
        .mockResolvedValueOnce(numeroSerieDuplicado ? null : equipamento)
        .mockResolvedValueOnce(
          numeroSerieDuplicado ? outroComNumeroSerie : equipamento,
        );
      repositorio.buscarPorPatrimonio
        .mockResolvedValueOnce(patrimonioDuplicado ? null : equipamento)
        .mockResolvedValueOnce(
          patrimonioDuplicado ? outroComPatrimonio : equipamento,
        );
      repositorio.atualizar.mockRejectedValue(new ErroUnicidadePersistencia());

      const atualizacao = servico.atualizarEquipamento(
        equipamento.id,
        novosDados,
      );

      await expect(atualizacao).rejects.toBeInstanceOf(ErroConflitoEquipamento);
      await expect(atualizacao).rejects.toHaveProperty('motivo', motivo);
      expect(repositorio.atualizar).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    new Error('Banco indisponivel.'),
    new ErroUnicidadePersistencia(
      'Conflito nao identificado na nova consulta.',
    ),
  ])(
    'preserva falhas de persistencia quando nao identifica duplicidade: %s',
    async (erro) => {
      repositorio.atualizar.mockRejectedValue(erro);

      await expect(
        servico.atualizarEquipamento(equipamento.id, dados),
      ).rejects.toBe(erro);
      expect(repositorio.atualizar).toHaveBeenCalledTimes(1);
    },
  );
});
