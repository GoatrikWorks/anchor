import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SiweMessage } from "siwe";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthService {
  private nonces = new Map<string, { nonce: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  generateNonce(address: string): string {
    const nonce = this.createNonce();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.nonces.set(address.toLowerCase(), { nonce, expiresAt });
    return nonce;
  }

  async verifySignature(
    message: string,
    signature: string
  ): Promise<{ token: string; address: string; identityId: number | null }> {
    const siweMessage = new SiweMessage(message);
    const address = siweMessage.address.toLowerCase();

    const stored = this.nonces.get(address);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException("Nonce expired or not found");
    }

    if (siweMessage.nonce !== stored.nonce) {
      throw new UnauthorizedException("Invalid nonce");
    }

    try {
      await siweMessage.verify({ signature });
    } catch {
      throw new UnauthorizedException("Invalid signature");
    }

    this.nonces.delete(address);

    const identity = await this.prisma.identity.findUnique({
      where: { owner: address },
    });

    const payload = {
      sub: address,
      identityId: identity?.id ?? null,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      address,
      identityId: identity?.id ?? null,
    };
  }

  private createNonce(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
