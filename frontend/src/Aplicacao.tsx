import { useState } from 'react';
import { FormularioCadastroEquipamento } from './FormularioCadastroEquipamento';
import { ListaEquipamentos } from './ListaEquipamentos';

export function Aplicacao({ urlApi }: { urlApi: string | undefined }) {
  const [versaoListagem, definirVersaoListagem] = useState(0);

  return (
    <>
      <header className="cabecalho">
        <div className="marca">
          <svg
            className="simbolo-marca"
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M15 5H7a2 2 0 0 0-2 2v26a2 2 0 0 0 2 2h8M25 5h8a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2h-8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M9 23h7l4-10 4 14 3-7h4"
              stroke="#19A7A0"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="23" r="2" fill="#19A7A0" />
            <circle cx="31" cy="20" r="2" fill="#19A7A0" />
          </svg>
          <span>MedAsset</span>
        </div>
        <span className="descricao-marca">
          Gestão de ativos médico-hospitalares
        </span>
      </header>

      <main>
        <div className="introducao">
          <p className="identificador">ENGENHARIA CLÍNICA · GESTÃO DE ATIVOS</p>
          <h1>Equipamentos</h1>
          <p>Cadastre e consulte os equipamentos médico-hospitalares.</p>
        </div>

        <FormularioCadastroEquipamento
          urlApi={urlApi}
          aoCadastrar={() => definirVersaoListagem((versao) => versao + 1)}
        />
        <ListaEquipamentos
          key={`${urlApi}-${versaoListagem}`}
          urlApi={urlApi}
        />
      </main>
    </>
  );
}
