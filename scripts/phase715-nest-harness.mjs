/** DEVELOPMENT TEST HARNESS ONLY. Real AppModule/SQL; only AI provider overridden. */
import path from "node:path";
import { createRequire } from "node:module";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE");
const req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !process.env.DB_NAME?.startsWith("VIntern_Phase715_")
)
  throw new Error("Refuse outside disposable test DB.");
req("reflect-metadata");
const { Test } = req("@nestjs/testing");
const { ValidationPipe, VersioningType } = req("@nestjs/common");
const { DocumentBuilder, SwaggerModule } = req("@nestjs/swagger");
const { AppModule } = req(path.join(be, "dist/app.module.js"));
const { AI_PROVIDER_TOKEN } = req(
  path.join(be, "dist/ai/ai-provider.interface.js"),
);
const provider = {
  name: "test",
  model: "phase715-deterministic",
  async generateStructured(request) {
    const failed = request.input.role === "qa";
    const data = request.validate({
      technicalScore: failed ? 58 : 85,
      softSkillScore: 72,
      criteria: [
        {
          code: "integration",
          score: failed ? 58 : 85,
          feedback: "Development TestAIProvider evaluation.",
        },
      ],
      strengths: failed ? [] : ["Concrete reasoning"],
      weaknesses: failed ? ["Needs technical practice"] : [],
      feedback: failed
        ? "Development interview needs improvement."
        : "Development interview passed.",
      recommendedRole: "backend",
      // Deliberately contradictory fields prove Nest computes decision/overall.
      overallScore: 0,
      decision: "failed",
      passed: false,
    });
    return {
      data,
      provider: this.name,
      model: this.model,
      latencyMs: 1,
      inputTokens: 10,
      outputTokens: 20,
    };
  },
};
const config = req(path.join(be, "dist/config/configuration.js")).appConfig(
  process.env,
);
const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(AI_PROVIDER_TOKEN)
  .useValue(provider)
  .compile();
const app = moduleRef.createNestApplication({ logger: ["error", "warn"] });
app.use(req("helmet")());
app.enableCors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
app.setGlobalPrefix("api");
app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
SwaggerModule.setup(
  "api/docs",
  app,
  SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("V-INTERN live development verification")
      .setVersion("2.0")
      .addBearerAuth()
      .build(),
  ),
);
await app.listen(8080);
console.log(
  "Real Nest AppModule listening :8080; disposable SQL DB; explicit TestAIProvider override. No production fallback.",
);
process.on("SIGTERM", () => {
  void app.close().then(() => process.exit());
});
