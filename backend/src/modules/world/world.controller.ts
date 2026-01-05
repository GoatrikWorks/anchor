import { Controller, Get } from "@nestjs/common";
import { WorldService } from "./world.service";

@Controller("world")
export class WorldController {
  constructor(private worldService: WorldService) {}

  @Get("state")
  async getWorldState() {
    return this.worldService.getWorldState();
  }
}
