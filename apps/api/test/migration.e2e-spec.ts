import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe.skip("Admin, DMs, Friends, Calls (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("AdminModule", () => {
    it("GET /admin/profile-assets (Authorized)", () => {
      return request(app.getHttpServer())
        .get("/admin/profile-assets")
        .expect(200);
    });
  });

  describe("DmsModule", () => {
    it("GET /dms", () => {
      return request(app.getHttpServer())
        .get("/dms")
        .expect(200);
    });
  });

  describe("FriendsModule", () => {
    it("GET /friends", () => {
      return request(app.getHttpServer())
        .get("/friends")
        .expect(200);
    });

    it("GET /friends/requests", () => {
      return request(app.getHttpServer())
        .get("/friends/requests")
        .expect(200);
    });
  });

  describe("CallsModule", () => {
    it("GET /calls/scheduled (Missing workspaceId)", () => {
      return request(app.getHttpServer())
        .get("/calls/scheduled")
        .expect(400);
    });
  });
});
