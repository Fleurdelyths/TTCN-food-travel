declare module "jsonwebtoken" {
  export interface JwtPayload {
    [key: string]: unknown;
    userId?: number;
  }
  const jwt: {
    sign(payload: object, secret: string, options?: object): string;
    verify(token: string, secret: string): JwtPayload | string;
  };
  export default jwt;
}
