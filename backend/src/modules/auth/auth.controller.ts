import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";

class NonceDto {
  address!: string;
}

class VerifyDto {
  message!: string;
  signature!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get("nonce")
  getNonce(@Query("address") address: string) {
    const nonce = this.authService.generateNonce(address);
    return { nonce };
  }

  @Post("verify")
  async verify(@Body() dto: VerifyDto) {
    return this.authService.verifySignature(dto.message, dto.signature);
  }
}
