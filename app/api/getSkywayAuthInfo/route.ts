import { NextResponse } from "next/server";
import { SkyWayAuthToken } from "@skyway-sdk/token";
import { AuthToken } from "@skyway-sdk/core";
import { v4 } from "uuid";
import { ApiResponse, CustomError, MySkywayAuthInfo } from "@/lib/interface";

export async function POST(): Promise<NextResponse> {
  let responseJson: ApiResponse<MySkywayAuthInfo | CustomError>;
  const APP_ID = process.env.APP_ID || ''
  const SKYWAY_SECRET_KEY = process.env.SKYWAY_SECRET_KEY || ''
  const exp_hour = 2;
  const jwt: AuthToken = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * exp_hour,
    iat: Math.floor(Date.now() / 1000),
    jti: v4(),
    scope: {
      app: {
        id: APP_ID,
        turn: false,
        actions: ["read"],
        channels: [
          {
            name: "*",
            actions: ["read", "create", "delete"],
            members: [
              {
                name: "*",
                actions: ["write"],
                // actions: ["create", "delete"],だとだめ
                publication: {
                  actions: ["write"],
                },
                subscription: {
                  actions: ["write"],
                },
              },
            ],
          },
        ],
      },
    },
  };
  const token = new SkyWayAuthToken(jwt);

  try {
    responseJson = {
      isSuccess: true,
      body: {
        jwt: jwt,
        skywayToken: token.encode(SKYWAY_SECRET_KEY),
      },
    };
  } catch (err) {
    responseJson = {
      isSuccess: false,
      body: {
        errorMessage: "token生成エラー",
      },
    };
    console.log(err)
  }
  return NextResponse.json(responseJson);
}
