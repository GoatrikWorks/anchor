import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthUser {
  address: string;
  identityId: number | null;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
