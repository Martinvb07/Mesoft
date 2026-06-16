import { Injectable, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/jwt-payload';

function allowedOrigins(): string[] {
  return (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins().includes(origin)) return cb(null, true);
      if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  },
  path: '/socket.io',
})
export class AppGateway implements OnGatewayConnection {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      (client.handshake.query?.token as string | undefined);

    if (!token) {
      this.logger.warn(`Conexión socket sin token, rechazada (${client.id})`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      if (!payload.restaurantId) {
        client.disconnect(true);
        return;
      }
      client.join(`r:${payload.restaurantId}`);
    } catch {
      this.logger.warn(`Token de socket inválido, rechazado (${client.id})`);
      client.disconnect(true);
    }
  }

  emitMesaUpdate(restaurantId: number, data: any) {
    this.server?.to(`r:${restaurantId}`).emit('mesa_update', data);
  }

  emitNuevoPedido(restaurantId: number, data: any) {
    this.server?.to(`r:${restaurantId}`).emit('nuevo_pedido', data);
  }

  emitPedidoCerrado(restaurantId: number, data: any) {
    this.server?.to(`r:${restaurantId}`).emit('pedido_cerrado', data);
  }

  emitItemListo(restaurantId: number, data: any) {
    this.server?.to(`r:${restaurantId}`).emit('item_listo', data);
  }

  emitPedidoPorCobrar(restaurantId: number, data: any) {
    this.server?.to(`r:${restaurantId}`).emit('pedido_por_cobrar', data);
  }
}
