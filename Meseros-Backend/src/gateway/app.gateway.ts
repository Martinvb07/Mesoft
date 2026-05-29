import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  path: '/socket.io',
})
export class AppGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const rid = client.handshake.query['restaurantId'];
    if (rid) client.join(`r:${rid}`);
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
}
