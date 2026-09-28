import { Module } from '@nestjs/common';
import { EquipamentosController } from './equipamentos/equipamentos.controller';
import { EquipamentosRepository } from './equipamentos/equipamentos.repository';
import { EquipamentosService } from './equipamentos/equipamentos.service';
import { PrismaEquipamentosRepository } from './equipamentos/prisma-equipamentos.repository';
import { PrismaService } from './prisma/prisma.service';

@Module({
  controllers: [EquipamentosController],
  providers: [
    PrismaService,
    EquipamentosService,
    {
      provide: EquipamentosRepository,
      useClass: PrismaEquipamentosRepository,
    },
  ],
})
export class AplicacaoModule {}
