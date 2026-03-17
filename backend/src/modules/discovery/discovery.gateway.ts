import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL, 'http://localhost:3000'
    ].filter(Boolean),
    credentials: true,
  },
})
export class DiscoveryGateway {
  @WebSocketServer()
  server: Server;

  broadcastDiscovery(data: any) {
    if (this.server) {
      this.server.emit('listing_discovered', data);
    }
  }
}
