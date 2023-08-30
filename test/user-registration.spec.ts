import chai from "chai";
import chaiHttp from "chai-http";
import dotenv from "dotenv";
import {StatusCodes} from "http-status-codes";
import process from "node:process";
import {NewUser} from "../src/entity/User";
import {DatabaseConnection} from "../src/utils/DatabaseConnection";
import {DatabaseCleaner} from "./utils/DatabaseCleaner";
import {expect} from "chai";
import {ObjectCopy} from "./utils/ObjectCopy";
import {Tester} from "./utils/Tester";

chai.use(chaiHttp);
chai.config.truncateThreshold = 0;

const HOST = "http://127.0.0.1:5000";
const voidValues = [null, undefined];
const randomNumberValues = [1, 50, 3.4];
const randomBooleanValues = [true, false];
const randomObjectValues: object[] = [
    {},
    {eee: 123},
    {aaa: "bcd"},
    {fgh: 3, abc: "eeee"},
    {abc: [123, "aaaa"]},
    {efg: {abc: [1, 4, 7, 9], efg: false}}
];
const randomArrayValues: any[] = [
    ["abc", "eee"],
    [1, 3],
    ["abc", 123, null, true],
    [],
    [{a: 56}, {}]
];
const randomStringValues = Array.from(["sddsds", "fffff", "eee", "null", "undefined"]).concat(
    Array.from<any>(randomNumberValues)
        .concat(randomBooleanValues, randomObjectValues, randomArrayValues)
        .map((value) => JSON.stringify(value))
);
describe("User registration", () => {
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
    const tester = new Tester((value: NewUser) => chai.request(HOST).post("/users").send(value));

    beforeEach(() => {
        user = {
            name: "Test",
            surname: "Test",
            email: "test@test.com",
            password: "Test123_",
            twoFactorAuthentication: true
        };
        return databaseCleaner.cleanDatabase();
    });

    it("Create a new user", async () => {
        user.twoFactorAuthentication = false;
        const response = await chai.request(HOST).post("/users").send(user);
        expect(response).to.have.status(StatusCodes.OK);
        expect(response).to.be.json;
        expect(response.body).to.be.deep.equal({error: false, created: true});
    });
    it("Create a new user with 2FA", async () => {
        user.twoFactorAuthentication = false;
        const response = await chai.request(HOST).post("/users").send(user);
        expect(response).to.have.status(StatusCodes.OK);
        expect(response).to.be.json;
        expect(response.body).to.be.deep.equal({error: false, created: true});
    });
    it("Test passwords", async () => {
        const passwords = ["Password123!", "AnotherPAssw0rd_!", "_!?PAss40rd"];
        let index = 0;

        for (const password of passwords) {
            const newUser = ObjectCopy.copyObject(user);
            user.email = `test${index}@test.com`;
            user.password = password;
            const response = await chai.request(HOST).post("/users").send(newUser);
            expect(response).to.have.status(StatusCodes.OK);
            expect(response).to.be.json;
            expect(response.body).to.be.deep.equal({error: false, created: true});
            index++;
        }
    });
    it("Already registered user", async () => {
        const response = await chai.request(HOST).post("/users").send(user);
        expect(response).to.have.status(StatusCodes.OK);
        expect(response).to.be.json;
        expect(response.body).to.be.deep.equal({error: false, created: true});
        await tester.toBeErrorred(user, StatusCodes.BAD_REQUEST);
    });
    it("Malformed fields", async () => {
        const names = Array.from<any>(["", "Too long name, which is very long"]).concat(
            voidValues,
            randomNumberValues,
            randomBooleanValues,
            randomObjectValues,
            randomArrayValues
        );
        const values = new Map<keyof (NewUser & Record<"password", string>), any[]>();
        values.set("name", names);
        values.set("surname", names);
        values.set(
            "email",
            Array.from(["aaaa#aaa.com", "eee@a", "123@", ".."]).concat(names, randomStringValues)
        );
        values.set("password", Array.from(names).concat(randomStringValues));
        values.set(
            "twoFactorAuthentication",
            Array.from<any>(voidValues).concat(
                randomNumberValues,
                randomObjectValues,
                randomArrayValues,
                randomStringValues
            )
        );

        const users: NewUser[] = [];
        for (const [key, value] of values.entries()) {
            const newUser = ObjectCopy.copyObject(user) as {[p: string]: any};
            newUser[key] = value;
            users.push(newUser as NewUser);
        }
        await tester.toBeErrorred(users, StatusCodes.BAD_REQUEST);
    });
    it("Malformed passwords", async () => {
        const passwords = [
            "Aa1_",
            "Too long password, but very long password 123_",
            "NO LOWER CASE LETTERS 123_",
            "no upper case letters 123_",
            "No digits _!",
            "No special characters 1"
        ];
        const users: NewUser[] = [];
        for (const password of passwords) {
            const newUser = ObjectCopy.copyObject(user);
            newUser.password = password;
            users.push(newUser);
        }
        await tester.toBeErrorred(users, StatusCodes.BAD_REQUEST);
    });
    it("Missing fields", async () => {
        const malformedUser: {[key: string]: any} = user;
        const users: NewUser[] = [];

        for (const name of Object.keys(user)) {
            const newUser = ObjectCopy.copyObject(malformedUser);
            delete newUser[name];
            users.push(newUser as NewUser);
        }
        await tester.toBeErrorred(users, StatusCodes.BAD_REQUEST);
    });
    it("Additional fields", async () => {
        const additionalFieldNames = ["newField", "27", "additionalField", "NoField", "extra"];
        const values = Array.from<any>(randomStringValues).concat(
            [null],
            randomNumberValues,
            randomBooleanValues,
            randomObjectValues,
            randomArrayValues
        );
        const malformedUser: {[key: string]: any} = user;
        const users: NewUser[] = [];

        for (const fieldName of additionalFieldNames) {
            for (const value of values) {
                const newUser = ObjectCopy.copyObject(malformedUser);
                newUser[fieldName] = value;
                users.push(newUser as NewUser);
            }
        }
        await tester.toBeErrorred(users, StatusCodes.BAD_REQUEST);
    });
});
