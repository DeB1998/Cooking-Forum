import {AssertionError, expect} from "chai";
import {Request,  Response} from "superagent";

export class Tester<T> {
    private readonly testFuntion: (object: T) => Request;

    constructor(testFuntion: (object: T) => Request) {
        this.testFuntion = testFuntion;
    }

    public async toBeErrorred(input: T | T[], status: number) {
        let inputArray: T[];
        if (!Array.isArray(input)) {
            inputArray = [input];
        } else {
            inputArray = input;
        }
        for (const inputValue of inputArray) {
            const response = await this.testFuntion(inputValue);
            try {
                expect(response).to.have.status(status);
                expect(response).to.be.json;
                expect(Object.keys(response.body).length).to.be.equal(2);
                expect(response.body).to.include.all.keys("error", "message");
                expect(response.body.error).to.be.true
            } catch (e: unknown) {
                if (e instanceof AssertionError) {
                    e.message = `With input ${JSON.stringify(inputValue)}, ${e.message}`;
                    throw e;
                }
            }
        }
    }
}
