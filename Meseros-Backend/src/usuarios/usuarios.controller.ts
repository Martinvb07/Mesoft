import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import * as bcrypt from 'bcrypt';

@Controller(['usuarios', 'api/usuarios'])
export class UsuariosController {
  constructor(
    private readonly usuarios: UsuariosService,
  ) {}

  @Get()
  async getAll() {
    return this.usuarios.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.usuarios.getById(Number(id));
    return user;
  }

  @Post()
  async create(@Body() body: any) {
    const payload = { ...(body || {}) };
    const raw = String(payload.contrasena || '');
    const looksHashed = raw.startsWith('$2');

    if (!payload.rol) payload.rol = 'mesero';

    if (raw && !looksHashed) {
      payload.contrasena = await bcrypt.hash(raw, 10);
    }

    const id = await this.usuarios.create(payload);
    return { id, ...payload };
  }

  @Post('login')
  async login(@Body() body: any) {
    const { correo, contrasena } = body || {};
    if (!correo || !contrasena) {
      throw new HttpException({ success: false, error: 'Correo y contraseña requeridos.' }, HttpStatus.BAD_REQUEST);
    }

    const usuario = await this.usuarios.validateLogin(String(correo), String(contrasena));
    if (!usuario) {
      throw new HttpException({ success: false, error: 'Credenciales incorrectas.' }, HttpStatus.UNAUTHORIZED);
    }

    // omit password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena: _pw, ...userData } = usuario;

    const restaurantId = await this.usuarios.resolveRestaurantIdForUsuario(usuario);
    return { success: true, usuario: userData, restaurantId };
  }
}
