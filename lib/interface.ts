import { AuthToken } from "@skyway-sdk/core";

export interface ApiResponse<T> {
  isSuccess: boolean,
  body: T
}

export interface CustomError {
  errorCode?: Number,
  errorMessage: string
}

export interface MySkywayAuthInfo {
  skywayToken: string,
  jwt: AuthToken
}
