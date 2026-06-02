import { Injectable, Logger } from '@nestjs/common';

// Firebase Admin se inicializa solo si existe la config
let messaging: any = null;

try {
  const admin = require('firebase-admin');
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccount) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    }
    messaging = admin.messaging();
  }
} catch {
  // Firebase no configurado — notificaciones push deshabilitadas
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');
  // tokens FCM por restaurante: restaurantId → Set<token>
  private readonly tokens = new Map<number, Set<string>>();

  isEnabled() {
    return messaging !== null;
  }

  registerToken(restaurantId: number, token: string) {
    if (!this.tokens.has(restaurantId)) {
      this.tokens.set(restaurantId, new Set());
    }
    this.tokens.get(restaurantId)!.add(token);
  }

  removeToken(restaurantId: number, token: string) {
    this.tokens.get(restaurantId)?.delete(token);
  }

  async sendToRestaurant(
    restaurantId: number,
    title: string,
    body: string,
    data: Record<string, string> = {},
  ) {
    if (!messaging) return;
    const tokenSet = this.tokens.get(restaurantId);
    if (!tokenSet || tokenSet.size === 0) return;

    const tokens = Array.from(tokenSet);
    try {
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (err) {
      this.logger.warn(`Error enviando notificación: ${err}`);
    }
  }

  // Eventos predefinidos
  async notifyStockBajo(restaurantId: number, producto: string, stock: number) {
    return this.sendToRestaurant(
      restaurantId,
      '⚠️ Stock bajo',
      `${producto} — quedan ${stock} unidades`,
      { tipo: 'stock_bajo', producto },
    );
  }

  async notifyNuevoPedido(restaurantId: number, mesa: string | number) {
    return this.sendToRestaurant(
      restaurantId,
      '🍽️ Nuevo pedido',
      `Mesa ${mesa} tiene un nuevo pedido`,
      { tipo: 'nuevo_pedido', mesa: String(mesa) },
    );
  }

  async notifyPedidoCerrado(restaurantId: number, mesa: string | number, total: number) {
    return this.sendToRestaurant(
      restaurantId,
      '✅ Cuenta cerrada',
      `Mesa ${mesa} — Total: $${total.toLocaleString('es-CO')}`,
      { tipo: 'pedido_cerrado', mesa: String(mesa) },
    );
  }
}
