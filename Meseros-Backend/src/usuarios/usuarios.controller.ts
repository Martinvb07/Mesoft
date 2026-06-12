import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from './usuarios.service';
import * as bcrypt from 'bcrypt';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/jwt-payload';

@Controller(['usuarios', 'api/usuarios'])
export class UsuariosController {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
  ) {}

  @Get()
  @Roles('admin')
  async getAll() {
    return this.usuarios.getAll();
  }

  @Get(':id')
  @Roles('admin')
  async getById(@Param('id') id: string) {
    const user = await this.usuarios.getById(Number(id));
    return user;
  }

  @Post()
  @Roles('admin')
  async create(@Body() body: any) {
    const payload = { ...(body || {}) };
    const raw = String(payload.contrasena || '');
    const looksHashed = raw.startsWith('$2');

    if (!payload.rol) payload.rol = 'mesero';

    if (raw && !looksHashed) {
      payload.contrasena = await bcrypt.hash(raw, 10);
    }

    const id = await this.usuarios.create(payload);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena: _pw, ...rest } = payload;
    return { id, ...rest };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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

    const tokenPayload: JwtPayload = {
      sub: usuario.id,
      restaurantId,
      rol: String(usuario.rol || 'mesero'),
      correo: usuario.correo,
    };
    const token = this.jwt.sign(tokenPayload);

    return { success: true, token, usuario: userData, restaurantId };
  }
}
