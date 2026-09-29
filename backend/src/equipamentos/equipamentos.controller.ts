import { Body, ConflictException, Controller, Get, Post } from '@nestjs/common';
import { CriarEquipamentoDto } from './criar-equipamento.dto';
import { EquipamentosService } from './equipamentos.service';
import { ErroConflitoEquipamento } from './erro-conflito-equipamento';

@Controller('equipamentos')
export class EquipamentosController {
  constructor(private readonly equipamentosService: EquipamentosService) {}

  @Get()
  listarEquipamentos() {
    return this.equipamentosService.listarEquipamentos();
  }

  @Post()
  async cadastrarEquipamento(@Body() dados: CriarEquipamentoDto) {
    try {
      return await this.equipamentosService.cadastrarEquipamento(dados);
    } catch (erro) {
      if (erro instanceof ErroConflitoEquipamento) {
        throw new ConflictException(erro.message);
      }

      throw erro;
    }
  }
}
