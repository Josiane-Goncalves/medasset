import { useState } from 'react';
import { FormularioCadastroEquipamento } from './FormularioCadastroEquipamento';
import { ListaEquipamentos } from './ListaEquipamentos';

export function Aplicacao({ urlApi }: { urlApi: string | undefined }) {
  const [versaoListagem, definirVersaoListagem] = useState(0);

  return (
    <>
      <header className="cabecalho">
        <div className="marca">
          <span className="simbolo-marca" aria-hidden="true">
            +
          </span>
          <span>MedAsset</span>
        </div>
        <span className="descricao-marca">Gestão de equipamentos</span>
      </header>

      <main>
        <div className="introducao">
          <p className="identificador">CONTROLE DE EQUIPAMENTOS</p>
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
