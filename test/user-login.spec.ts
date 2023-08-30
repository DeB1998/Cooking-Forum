import chai, {expect} from "chai";
import chaiHttp from "chai-http";
import dotenv from "dotenv";
import {StatusCodes} from "http-status-codes";
import jsonwebtoken from "jsonwebtoken";
import {Test} from "mocha";
import process from "node:process";
import {NewUser} from "../src/entity/User";
import {DatabaseConnection} from "../src/utils/DatabaseConnection";
import {DatabaseCleaner} from "./utils/DatabaseCleaner";

chai.use(chaiHttp);
chai.config.truncateThreshold = 0;

const HOST = "http://127.0.0.1:5000";

type TestUser = NewUser & Record<"password", string>;

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
    let user: TestUser;

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
});
