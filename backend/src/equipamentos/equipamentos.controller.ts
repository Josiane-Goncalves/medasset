import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { AtualizarEquipamentoDto } from './atualizar-equipamento.dto';
import { CriarEquipamentoDto } from './criar-equipamento.dto';
import { EquipamentosService } from './equipamentos.service';
import { ErroConflitoEquipamento } from './erro-conflito-equipamento';
import { ErroEquipamentoNaoEncontrado } from './erro-equipamento-nao-encontrado';

@Controller('equipamentos')
export class EquipamentosController {
  constructor(private readonly equipamentosService: EquipamentosService) {}

  @Get()
  listarEquipamentos() {
    return this.equipamentosService.listarEquipamentos();
  }

  @Get(':id')
  async buscarEquipamentoPorId(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.equipamentosService.buscarEquipamentoPorId(id);
    } catch (erro) {
      if (erro instanceof ErroEquipamentoNaoEncontrado) {
        throw new NotFoundException(erro.message);
      }

      throw erro;
    }
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

  @Put(':id')
  async atualizarEquipamento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: AtualizarEquipamentoDto,
  ) {
    try {
      return await this.equipamentosService.atualizarEquipamento(id, dados);
    } catch (erro) {
      if (erro instanceof ErroEquipamentoNaoEncontrado) {
        throw new NotFoundException(erro.message);
      }

      if (erro instanceof ErroConflitoEquipamento) {
        throw new ConflictException(erro.message);
      }

      throw erro;
    }
  }
}
