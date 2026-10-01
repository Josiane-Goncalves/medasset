import { useEffect, useRef, useState } from 'react';
import { listarEquipamentos } from './listar-equipamentos';
import type { Equipamento } from './equipamento';
import { DetalhesEquipamento } from './DetalhesEquipamento';

type EstadoListagem =
  | { tipo: 'carregando' }
  | { tipo: 'sucesso'; equipamentos: Equipamento[] }
  | { tipo: 'erro' };

export function ListaEquipamentos({ urlApi }: { urlApi: string | undefined }) {
  const [estado, definirEstado] = useState<EstadoListagem>({
    tipo: 'carregando',
  });

  const [selecao, definirSelecao] = useState<{
    id: string;
    versao: number;
  } | null>(null);
  const botaoSelecionado = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controlador = new AbortController();

    listarEquipamentos(urlApi, controlador.signal)
      .then((equipamentos) => {
        if (!controlador.signal.aborted) {
          definirEstado({ tipo: 'sucesso', equipamentos });
        }
      })
      .catch(() => {
        if (!controlador.signal.aborted) definirEstado({ tipo: 'erro' });
      });

    return () => controlador.abort();
  }, [urlApi]);

  return (
    <section
      className="listagem"
      aria-labelledby="titulo-listagem"
      aria-busy={estado.tipo === 'carregando'}
    >
      <h2 id="titulo-listagem">Equipamentos cadastrados</h2>

      {estado.tipo === 'carregando' && (
        <p className="estado-listagem" role="status">
          Carregando equipamentos…
        </p>
      )}
      {estado.tipo === 'erro' && (
        <p className="mensagem mensagem-erro" role="alert">
          Não foi possível carregar os equipamentos. Tente novamente.
        </p>
      )}
      {estado.tipo === 'sucesso' &&
        (estado.equipamentos.length === 0 ? (
          <p className="estado-listagem" role="status">
            Nenhum equipamento cadastrado.
          </p>
        ) : (
          <div
            className="tabela-responsiva"
            role="region"
            aria-label="Tabela de equipamentos"
            tabIndex={0}
          >
            <table aria-labelledby="titulo-listagem">
              <thead>
                <tr>
                  <th scope="col">Equipamento</th>
                  <th scope="col">Marca</th>
                  <th scope="col">Modelo</th>
                  <th scope="col">Número de série</th>
                  <th scope="col">Patrimônio</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {estado.equipamentos.map((equipamento) => (
                  <tr key={equipamento.id}>
                    <td>{equipamento.equipamento}</td>
                    <td>{equipamento.marca}</td>
                    <td>{equipamento.modelo}</td>
                    <td>{equipamento.numeroSerie}</td>
                    <td>{equipamento.patrimonio ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="botao-secundario"
                        aria-label={`Ver detalhes de ${equipamento.equipamento} (${equipamento.numeroSerie})`}
                        aria-expanded={selecao?.id === equipamento.id}
                        aria-controls={
                          selecao?.id === equipamento.id
                            ? 'detalhes-equipamento'
                            : undefined
                        }
                        onClick={(evento) => {
                          botaoSelecionado.current = evento.currentTarget;
                          definirSelecao((anterior) => ({
                            id: equipamento.id,
                            versao: (anterior?.versao ?? 0) + 1,
                          }));
                        }}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      {selecao && (
        <DetalhesEquipamento
          key={`${selecao.id}-${selecao.versao}`}
          urlApi={urlApi}
          id={selecao.id}
          aoAtualizar={(equipamentoAtualizado) => {
            definirEstado((anterior) =>
              anterior.tipo === 'sucesso'
                ? {
                    ...anterior,
                    equipamentos: anterior.equipamentos.map((equipamento) =>
                      equipamento.id === equipamentoAtualizado.id
                        ? equipamentoAtualizado
                        : equipamento,
                    ),
                  }
                : anterior,
            );
          }}
          aoFechar={() => {
            definirSelecao(null);
            botaoSelecionado.current?.focus();
          }}
        />
      )}
    </section>
  );
}
