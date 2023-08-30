import chai, {expect} from "chai";
import chaiHttp from "chai-http";
import dotenv from "dotenv";
import {StatusCodes} from "http-status-codes";
import process from "node:process";
import {NewUser} from "../src/entity/User";
import {DatabaseConnection} from "../src/utils/DatabaseConnection";
import {DatabaseCleaner} from "./utils/DatabaseCleaner";
import jsonwebtoken from "jsonwebtoken";
import {Tester} from "./utils/Tester";

chai.use(chaiHttp);
chai.config.truncateThreshold = 0;

const HOST = "http://127.0.0.1:5000";

describe("User login", () => {
    const result = dotenv.config();
    if (result.error !== undefined) {
        throw result.error;
    }
    const databaseConnection = new DatabaseConnection(
        process.env["DATABASE_HOST"] || "127.0.0.1",
        parseInt(process.env["DATABASE_PORT"] || "5432"),
        process.env["DATABASE_NAME"] || "",
        process.env["DATABASE_USER"] || "",
        process.env["DATABASE_PASSWORD"] || ""
    );
    const databaseCleaner = new DatabaseCleaner(databaseConnection);
    let user: NewUser & Record<"password", string>;
    const tester = new Tester((value: [string, string]) =>
        chai.request(HOST).get("/jwt").auth(value[0], value[1], {type: "basic"}).send()
    );

    beforeEach(async () => {
        await databaseCleaner.cleanDatabase();
        user = {
            name: "Test",
            surname: "Test",
            email: "test@test.com",
            password: "Test123_",
            twoFactorAuthentication: false
        };
        return chai.request(HOST).post("/users").send(user);
    });

    it("User login", async () => {
        const response = await chai
            .request(HOST)
            .get("/jwt")
            .auth(user.email, user.password, {type: "basic"})
            .send();

        expect(response).to.have.status(StatusCodes.OK);
        expect(response).to.be.json;
        expect(response.body).to.include({error: false, requiresTwoFactorAuthentication: false});
        expect(Object.keys(response.body).length).to.be.equal(3);
        expect(response.body).to.include.all.keys(
            "error",
            "jwt",
            "requiresTwoFactorAuthentication"
        );
        const jwt = (response.body as {jwt: string}).jwt;
        const payload = jsonwebtoken.verify(jwt, process.env["JWT_SECRET"] || "");
        expect(payload).to.include.all.keys("userId");
        expect((payload as {userId: number}).userId).to.be.greaterThan(0);
    });
    it("Wrong credentials", async () => {
        const emails = [
            "a@a.com",
            "user@gmail.com",
            "user2@outlook.com",
            "null",
            "undefined",
            "123"
        ];
        const passwords = ["Password123_", "aaaa", "null", "123", "{}"];

        const credentials: [string, string][] = [];

        for (const email of emails) {
            credentials.push([email, user.password]);
        }
        for (const password of passwords) {
            credentials.push([user.email, password]);
        }

        await tester.toBeErrorred(credentials, StatusCodes.FORBIDDEN);
    });
    it("Missing credentials", async () => {
        const noCredentialsTester = new Tester(() => chai.request(HOST).get("/jwt").send());
        await noCredentialsTester.toBeErrorred({}, StatusCodes.FORBIDDEN);
    });
});
