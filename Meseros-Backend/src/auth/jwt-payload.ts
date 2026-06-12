export type JwtPayload = {
  sub: number; // usuario id
  restaurantId: number | null;
  rol: string;
  correo: string;
};
