export interface User {
  id: string;
  username: string;
  role: 'admin' | 'player'; // ggf. später 'viewer' oder andere Rollen
  iat?: number; // optional: issued at
  exp?: number; // optional: expires at
}
