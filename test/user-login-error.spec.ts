import chai from "chai";
import chaiHttp from "chai-http";
import dotenv from "dotenv";
import {StatusCodes} from "http-status-codes";
import {Test} from "mocha";
import process from "node:process";
import {NewUser} from "../src/entity/User";
import {DatabaseConnection} from "../src/utils/DatabaseConnection";
import {DatabaseCleaner} from "./utils/DatabaseCleaner";
import {Tester} from "./utils/Tester";

chai.use(chaiHttp);
chai.config.truncateThreshold = 0;

const HOST = "http://127.0.0.1:5000";

type TestUser = NewUser & Record<"password", string>;

async function testWrongCredentials(tester: Tester<[string, string]>, user: TestUser) {
    const wrongEmails = [
        "a@a.com",
        "user@gmail.com",
        "user2@outlook.com",
        "null",
        "undefined",
        "123"
    ];
    const wrongPasswords = ["Password123_", "aaaa", "null", "123", "{}"];

    const credentials: [string, string][] = [];

    for (const wrongEmail of wrongEmails) {
        credentials.push([wrongEmail, user.password]);
    }
    for (const wrongPassword of wrongPasswords) {
        credentials.push([user.email, wrongPassword]);
    }

    await tester.toBeErrorred(credentials, StatusCodes.FORBIDDEN);
}

describe("User login error", () => {
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
    let user: TestUser;
    let user2fa: TestUser;
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
        user2fa = {
            name: "Test",
            surname: "Test",
            email: "test2@test.com",
            password: "Test123_",
            twoFactorAuthentication: true
        };
        return Promise.all([
            chai.request(HOST).post("/users").send(user),
            chai.request(HOST).post("/users").send(user2fa)
        ]);
    });

    it("Wrong credentials", async () => {
        await testWrongCredentials(tester, user);
        await testWrongCredentials(tester, user2fa);
    });
    it("Missing credentials", async () => {
        const noCredentialsTester = new Tester(() => chai.request(HOST).get("/jwt").send());
        await noCredentialsTester.toBeErrorred({}, StatusCodes.FORBIDDEN);
    });
});
