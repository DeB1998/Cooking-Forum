import {SuccessfulResponse} from "./SuccessfulResponse";

export interface UserCreationResponse extends SuccessfulResponse{
    created: true;
}
