
import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './src/modules/ai/ai.service';
import { ConfigModule } from '@nestjs/config';

async function bootstrap() {
  const module: TestingModule = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true })],
    providers: [AiService],
  }).compile();

  const aiService = module.get<AiService>(AiService);
  
  const query = "get an shared apartment in berlin, that I can move in by next month";
  console.log(`Testing query: "${query}"`);
  
  try {
      const result = await aiService.extractSearchIntent(query);
      console.log("Extracted Intent:", JSON.stringify(result, null, 2));
  } catch (e) {
      console.error(e);
  }
}
bootstrap();
