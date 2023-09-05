/***************************************************************************************************
 *
 * This file is part of the Cooking Forum web application created by Alessio De Biasi.
 *
 * The Cooking Forum web application is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * The Cooking Forum web application is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with the Cooking Forum
 * web application. If not, see <http://www.gnu.org/licenses/>.
 *
 * Copyright © Alessio De Biasi, 2023.
 *
 **************************************************************************************************/

/**
 * Error generated when the client sends an HTTP request to a non-existent endpoint.
 */
export class InvalidEndpointError extends Error {
    /**
     * Creates a new error generated when the client sends an HTTP request to a non-existent
     * endpoint.
     *
     * @param message Message describing the error.
     */
    constructor(message: string) {
        // Set the message
        super(message);
        // Set the prototype, so that the 'instanceof' operator works as expected
        Object.setPrototypeOf(this, InvalidEndpointError.prototype);
        // Set the name, so that it is displayed in the stacktraces in place of 'Error'
        this.name = "InvalidEndpointError";
    }
}
