"use client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { useEffect, useState } from "react";
import { ApiResponse, CustomError, MySkywayAuthInfo } from "@/lib/interface";
import { skywayTokenState, myChannelNameState, skywayJwtForTokenState } from "@/lib/context";
import { JA_CHANNEL_MAPPINGS } from "@/lib/constant";
import { validSkywayToken } from "@/lib/controlSkyway";

export default function Lounge() {
  const router = useRouter();
  const [skywayToken, setSkywayToken] = useRecoilState(skywayTokenState);
  const [skywayJwtForToken, setSkywayJwtForToken] = useRecoilState(skywayJwtForTokenState);

  const [_, setMyChannelName] = useRecoilState(myChannelNameState);
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  const getToken = async () => {
    const response = await fetch("/api/getSkywayAuthInfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const apiResponse: ApiResponse<MySkywayAuthInfo | CustomError> =
      await response.json();

    if (response.ok) {
      if (apiResponse.isSuccess) {
        const apiResponseBody = apiResponse.body as MySkywayAuthInfo;
        setSkywayToken(apiResponseBody.skywayToken);
        setSkywayJwtForToken(apiResponseBody.jwt)
      } else {
        const apiResponseBody = apiResponse.body as CustomError;
        toast.error(apiResponseBody.errorMessage);
      }
    } else {
      toast.error("connectionError");
      console.log(response)
    }
  };

  const goChannelPage = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const channelName = event.currentTarget.textContent || "";
    if (!Object.keys(JA_CHANNEL_MAPPINGS).includes(channelName)) {
      return toast.error("チャンネル名が不正です");
    }
    if (!skywayToken) {
      return toast.error("skywayを利用するTokenがありません");
    }
    setMyChannelName(channelName);
    router.push(`/channel/`);
  };

  return (
    <section className="text-gray-600">
      <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
        <div className="w-4/6 bg-gray-100 rounded-lg p-8 flex flex-col mx-auto mt-10">
          <h1 className="text-2xl font-medium title-font mb-4 text-gray-900 text-center">
            みんな俺になる匿名チャット
          </h1>
          <p className="lg:w-2/3 mx-auto leading-relaxed text-base text-center mb-5">
            みんな俺になる。
            <br />
            人の顔色を気にする必要がない新世代チャット。
            <br />
            自由なディスカッションをしよう。
            <br />
          </p>
          {domLoaded && (skywayJwtForToken) && <h2 className="underline decoration-dotted underline-offset-8 text-xl text-red-800 text-center mt-5 mb-3">参加可能チャンネルリスト</h2> }
          <div className="flex flex-wrap">
            {domLoaded && validSkywayToken(skywayJwtForToken) ? (
              Object.keys(JA_CHANNEL_MAPPINGS).map((item, idx) => {
                return (
                  <button
                    key={idx}
                    className="p-2 w-1/3"
                    onClick={goChannelPage}
                  >
                    <span className="justify-center h-full flex items-center border-gray-400 bg-gray-600 border-2 p-4 rounded-lg hover:bg-gray-800 text-white title-font font-medium">
                      {item}
                    </span>
                  </button>
                );
              })
            ) : (
              <button
                className="text-white bg-red-500 border-0 py-2 px-8 focus:outline-none hover:bg-red-600 rounded text-lg w-full"
                onClick={getToken}
              >
                まず利用トークンを発行！
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
