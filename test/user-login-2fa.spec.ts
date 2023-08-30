import chai, {expect} from "chai";
import chaiHttp from "chai-http";
import dotenv from "dotenv";
import {StatusCodes} from "http-status-codes";
import jsonwebtoken from "jsonwebtoken";
import process from "node:process";
import {Response} from "superagent";
import {NewUser} from "../src/entity/User";
import {DatabaseConnection} from "../src/utils/DatabaseConnection";
import {DatabaseCleaner} from "./utils/DatabaseCleaner";
import {ObjectCopy} from "./utils/ObjectCopy";
import {RandomValues} from "./utils/RandomValues";
import {Tester} from "./utils/Tester";
import {TestOtpSender} from "./utils/TestOtpSender";
import {TestRequester} from "./utils/TestRequester";

chai.use(chaiHttp);
chai.config.truncateThreshold = 0;

type TestUser = NewUser & Record<"password", string>;

class LoginRequestSender {
    private requester: ChaiHttp.Agent;
    private user: TestUser;
    private jwtSecret: string;

    constructor(requester: ChaiHttp.Agent, user: TestUser, jwtSecret: string) {
        this.requester = requester;
        this.user = user;
        this.jwtSecret = jwtSecret;
    }

    public getJwt(response: Response) {
        return (response.body as {jwt: string}).jwt;
    }

    public async sendRequest() {
        return this.requester
            .get("/jwt")
            .auth(this.user.email, this.user.password, {type: "basic"})
            .redirects(0)
            .send();
    }
}

describe("User login 2FA", () => {
    const result = dotenv.config();
    if (result.error !== undefined) {
        throw result.error;
    }
    const otpSender = new TestOtpSender();
    const requester = TestRequester.createRequester(otpSender);
    const databaseConnection = new DatabaseConnection(
        process.env["DATABASE_HOST"] || "127.0.0.1",
        parseInt(process.env["DATABASE_PORT"] || "5432"),
        process.env["DATABASE_NAME"] || "",
        process.env["DATABASE_USER"] || "",
        process.env["DATABASE_PASSWORD"] || ""
    );
    const databaseCleaner = new DatabaseCleaner(databaseConnection);
    let user: TestUser;
    const jwtSecret = process.env["JWT_SECRET"] || "";
    let loginRequestSender: LoginRequestSender;
    const tester = new Tester((value: [string, any]) =>
        requester.get("/2fa/jwt").auth(value[0], {type: "bearer"}).send(value[1])
    );

    beforeEach(async () => {
        await databaseCleaner.cleanDatabase();
        user = {
            name: "Test",
            surname: "Test",
            email: "test@test.com",
            password: "Test123_",
            twoFactorAuthentication: true
        };
        loginRequestSender = new LoginRequestSender(requester, user, jwtSecret);
        return requester.post("/users").send(user);
    });

    after(() => requester.close());

    it("User login", async () => {
        const response = await loginRequestSender.sendRequest();
        expect(response).to.have.status(StatusCodes.MOVED_TEMPORARILY);
        expect(response).to.be.json;
        expect(response.body).to.include({error: false, requiresTwoFactorAuthentication: true});
        expect(Object.keys(response.body).length).to.be.equal(3);
        expect(response.body).to.include.all.keys(
            "error",
            "jwt",
            "requiresTwoFactorAuthentication"
        );

        const jwt = loginRequestSender.getJwt(response);
        const payload = jsonwebtoken.verify(jwt, jwtSecret);
        expect(payload).to.include.all.keys("userId", "otpId");
        const userId = (payload as {userId: number}).userId;
        expect(userId).to.be.greaterThan(0);
        expect((payload as {otpId: number}).otpId).to.be.greaterThan(0);

        const otp = otpSender.getOtp();

        const twoFactorAuthResponse = await requester
            .get("/2fa/jwt")
            .auth(jwt, {type: "bearer"})
            .send({otp});
        expect(twoFactorAuthResponse).to.have.status(StatusCodes.OK);
        expect(twoFactorAuthResponse).to.be.json;
        expect(twoFactorAuthResponse.body).to.include({
            error: false,
            requiresTwoFactorAuthentication: false
        });
        expect(Object.keys(twoFactorAuthResponse.body).length).to.be.equal(3);
        expect(twoFactorAuthResponse.body).to.include.all.keys(
            "error",
            "jwt",
            "requiresTwoFactorAuthentication"
        );
        const jwt2Fa = (twoFactorAuthResponse.body as {jwt: string}).jwt;
        const payload2Fa = jsonwebtoken.verify(jwt2Fa, jwtSecret);
        expect(payload2Fa).to.include.all.keys("userId");
        expect(payload2Fa).to.not.include.all.keys("otpId");
        expect((payload2Fa as {userId: number}).userId).to.be.equal(userId);
    });

    it("Wrong OTP", async () => {
        const response = await loginRequestSender.sendRequest();
        const jwt = loginRequestSender.getJwt(response);
        const otp = otpSender.getOtp();

        const otps = [
            `${otp}1`,
            `${otp}abc`,
            `${otp.substring(0, 5)}${(parseInt(otp.charAt(5)) + 1) % 10}`
        ];
        const values = otps.map((value) => [jwt, {otp: value}] as [string, any]);

        await tester.toBeErrorred(values, StatusCodes.FORBIDDEN);
    });

    it("Wrong OTP types", async () => {
        const response = await loginRequestSender.sendRequest();
        const jwt = loginRequestSender.getJwt(response);
        const otps = Array.from<any>(RandomValues.VOID_VALUES).concat(
            RandomValues.NUMBER_VALUES,
            RandomValues.BOOLEAN_VALUES,
            RandomValues.OBJECT_VALUES,
            RandomValues.ARRAY_VALUES
        );
        const values = otps.map((value) => [jwt, {otp: value}] as [string, any]);

        await tester.toBeErrorred(values, StatusCodes.BAD_REQUEST);
    });

    it("Missing OTP", async () => {
        const response = await loginRequestSender.sendRequest();
        const jwt = loginRequestSender.getJwt(response);

        await tester.toBeErrorred([[jwt, {}]], StatusCodes.BAD_REQUEST);
    });
    it("Additional fields", async () => {
        const response = await loginRequestSender.sendRequest();
        const jwt = loginRequestSender.getJwt(response);
        const additionalFieldNames = ["newField", "27", "additionalField", "NoField", "extra"];
        const values = Array.from<any>(RandomValues.STRING_VALUES).concat(
            [null],
            RandomValues.NUMBER_VALUES,
            RandomValues.BOOLEAN_VALUES,
            RandomValues.OBJECT_VALUES,
            RandomValues.ARRAY_VALUES
        );
        const malformedRequestBodies: [string, {[key: string]: any}][] = [];

        for (const fieldName of additionalFieldNames) {
            for (const value of values) {
                const newBody = ObjectCopy.copyObject({otp: otpSender.getOtp()} as {
                    [key: string]: any;
                });
                newBody[fieldName] = value;
                malformedRequestBodies.push([jwt, newBody]);
            }
        }
        await tester.toBeErrorred(malformedRequestBodies, StatusCodes.BAD_REQUEST);
    });
    it("Missing JWT token", async () => {
        await loginRequestSender.sendRequest();
        const otp = otpSender.getOtp();
        const tester = new Tester(() => requester.get("/2fa/jwt").send({otp}));
        await tester.toBeErrorred({}, StatusCodes.BAD_REQUEST);
    });
    it("Double OTP", async () => {
        const response = await loginRequestSender.sendRequest();
        const jwt = loginRequestSender.getJwt(response);
        const otp = otpSender.getOtp();

        const twoFactorAuthResponse = await requester
            .get("/2fa/jwt")
            .auth(jwt, {type: "bearer"})
            .send({otp});
        expect(twoFactorAuthResponse).to.have.status(StatusCodes.OK);

        await tester.toBeErrorred([[jwt, {otp}]], StatusCodes.FORBIDDEN);
    });
    it("Expired OTP", async () => {
        const response = await loginRequestSender.sendRequest();
        const jwt = loginRequestSender.getJwt(response);
        const otp = otpSender.getOtp();

        await new Promise((resolve) => setTimeout(resolve, 2000));

        await tester.toBeErrorred([[jwt, {otp}]], StatusCodes.FORBIDDEN);
    });
});
