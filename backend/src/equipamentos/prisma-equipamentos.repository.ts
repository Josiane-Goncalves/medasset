import { Injectable } from '@nestjs/common';
import { Prisma } from '../gerado/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DadosCadastroEquipamento,
  EquipamentosRepository,
  ErroUnicidadePersistencia,
} from './equipamentos.repository';

@Injectable()
export class PrismaEquipamentosRepository extends EquipamentosRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  listar() {
    return this.prisma.equipamento.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  buscarPorId(id: string) {
    return this.prisma.equipamento.findUnique({ where: { id } });
  }

  buscarPorNumeroSerie(numeroSerie: string) {
    return this.prisma.equipamento.findUnique({ where: { numeroSerie } });
  }

  buscarPorPatrimonio(patrimonio: string) {
    return this.prisma.equipamento.findUnique({ where: { patrimonio } });
  }

  async criar(dados: DadosCadastroEquipamento) {
    try {
      return await this.prisma.equipamento.create({
        data: {
          equipamento: dados.equipamento,
          marca: dados.marca,
          modelo: dados.modelo,
          numeroSerie: dados.numeroSerie,
          patrimonio: dados.patrimonio,
        },
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        throw new ErroUnicidadePersistencia(
          'Violacao de unicidade na persistencia.',
          {
            cause: erro,
          },
        );
      }

      throw erro;
    }
  }
}
