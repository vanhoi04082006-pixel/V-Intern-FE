/** DEVELOPMENT TEST HARNESS ONLY. Real AppModule/SQL; only AI provider overridden. */
import path from "node:path";
import { createRequire } from "node:module";
import { buildTestSprintPlan, buildTestInterviewPayload } from "./project-first-provider.mjs";
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
    if (
      request.task === "ai-mentor" &&
      request.input.userMessage === "[phase7-test-timeout]"
    ) {
      const { AiProviderTimeoutError } = req(
        path.join(be, "dist/ai/ai-errors.js"),
      );
      throw new AiProviderTimeoutError("Development timeout scenario");
    }
    let payload;
    if (request.task === "sprint-plan")
      payload = buildTestSprintPlan(request.input);
    else if (request.task === "ai-mentor")
      payload = {
        answer:
          "Gợi ý development: chia nhiệm vụ thành các bước nhỏ, kiểm tra yêu cầu và trao đổi với giảng viên.",
        summary: "Lập kế hoạch nhiệm vụ.",
        followUps: ["Tôi nên bắt đầu thế nào?"],
      };
    else if (request.task === "evaluation-assistance")
      payload = {
        criterionSuggestions: request.input.evaluationContext.criteria.map(
          (c) => ({
            criterionCode: c.code,
            suggestedScore: 95,
            evidence: ["Development deterministic evaluation context"],
            comment: "Gợi ý test, giảng viên giữ quyết định chính thức.",
          }),
        ),
        strengths: ["Phân tích rõ"],
        improvementAreas: ["Quản lý thời gian"],
        summary: "AI đề xuất 95, không ghi điểm chính thức.",
        confidence: 0.8,
      };
    else if (request.task === "recommendation")
      payload = {
        recommendations: [
          {
            type: "delivery_improvement",
            priority: "medium",
            title: "Lập kế hoạch công việc",
            reason: "Xem xét số nhiệm vụ được giao.",
            actions: ["Chia nhiệm vụ thành các bước nhỏ."],
            evidenceMetricCodes: ["totalTaskCount"],
          },
        ],
        summary: "Khuyến nghị test từ dữ liệu nhiệm vụ.",
      };
    const data = request.validate(payload ?? buildTestInterviewPayload(request));
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
