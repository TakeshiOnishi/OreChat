"use client";
import toast from "react-hot-toast";
import { useState, useLayoutEffect, useRef } from "react";
import {
  SkyWayContext,
  SkyWayChannel,
  LocalPerson,
  Channel,
  LocalVideoStream,
  Publication,
  RemoteVideoStream,
  RemoteAudioStream,
  MemberJoinedEvent,
  MemberLeftEvent,
  RemoteMember,
  LocalAudioStream,
} from "@skyway-sdk/core";
import { faker } from '@faker-js/faker/locale/ja';
import { useRecoilState } from "recoil";
import {
  skywayTokenState,
  myChannelNameState,
  skywayJwtForTokenState,
  isVideoInputReadyState,
  isAudioInputReadyState,
} from "@/lib/context";
import { JA_CHANNEL_MAPPINGS } from "@/lib/constant";
import MyVideo from "./myVideo";
import { validSkywayToken } from "@/lib/controlSkyway";

type MemberInfo = { memberId: string; memberName: string };

export default function Channel() {
  const [skywayToken, setSkywayToken] = useRecoilState(skywayTokenState);
  const [skywayJwtForToken, setSkywayJwtForToken] = useRecoilState(
    skywayJwtForTokenState
  );
  const [myChannelName] = useRecoilState(myChannelNameState);
  const [memberList, setMemberList] = useState<MemberInfo[]>([]);
  const [isVideoInputReady] = useRecoilState(isVideoInputReadyState);
  const [isAudioInputReady] = useRecoilState(isAudioInputReadyState);
  const [isChannelJoined, setIsChannelJoined] = useState(false);
  const [isChannelInitializing, setIsChannelInitializing] = useState(false);
  const [myName, setMyName] = useState("");
  const myVideoRef = useRef<HTMLCanvasElement>(null);
  const memberListRef = useRef<HTMLDivElement>(null);
  let myChannel: Channel;
  let mememe: LocalPerson;

  useLayoutEffect(() => {
    setMyName(faker.person.lastName());
    if (!validSkywayToken(skywayJwtForToken)) {
      setSkywayToken("");
      setSkywayJwtForToken("");
      location.href = "/";
    }
  }, []);

  const subscribeAndAttach = async (publication: Publication) => {
    if (!myChannel) {
      return;
    }
    if (publication.publisher.id === mememe.id) return;
    const { stream } = await mememe.subscribe<
      RemoteAudioStream | RemoteVideoStream
    >(publication.id);

    let mediaElement;
    const memberDiv = memberListRef.current
      ?.getElementsByClassName(`member-${publication.publisher.id}`)
      .item(0) as HTMLDivElement;
    switch (stream.track.kind) {
      case "video":
        mediaElement = memberDiv
          .getElementsByTagName("video")
          .item(0) as HTMLVideoElement;
        break;
      case "audio":
        mediaElement = memberDiv
          .getElementsByTagName("audio")
          .item(0) as HTMLAudioElement;
        break;
      default:
        return;
    }
    stream.attach(mediaElement);
  };

  const startMemberListControl = () => {
    if (!myChannel) {
      return;
    }
    myChannel.members.forEach((remoteMember: RemoteMember) => {
      if (remoteMember.id == mememe.id) {
        return;
      }
      setMemberList((prev) => [
        ...prev,
        { memberId: remoteMember.id, memberName: remoteMember.metadata || "" },
      ]);
    });

    myChannel.onMemberJoined.add((event: MemberJoinedEvent) => {
      setMemberList((prev) => [
        ...prev,
        { memberId: event.member.id, memberName: event.member.metadata || "" },
      ]);
      toast(`${event.member.metadata}さんが参加しました`, { icon: "👏" });
    });
    myChannel.onMemberLeft.add((event: MemberLeftEvent) => {
      console.log(event);
      setMemberList((prev) =>
        prev.filter((member) => member.memberId !== event.member.id)
      );
      toast(`${event.member.metadata}さんが退出しました`, { icon: "💨" });
    });
  };

  const publishVideoStream = async () => {
    const avatarCanvas = myVideoRef.current
      ?.getElementsByClassName("refAvatarCanvas")
      .item(0) as HTMLCanvasElement;
    if (avatarCanvas) {
      const myVideoInputStream: LocalVideoStream = new LocalVideoStream(
        avatarCanvas.captureStream().getVideoTracks()[0]
      );
      await mememe.publish(myVideoInputStream);
      toast(`映像配信が開始されました`, { icon: "🎥" });
    } else {
      toast.error(
        "映像初期化に何かしらエラーが発生しました。\nページを更新等してお試しください。"
      );
    }
  };
  const publishAudioStream = async () => {
    const myVoice = myVideoRef.current
      ?.getElementsByClassName("refMyVoice")
      .item(0) as HTMLAudioElement;
    if (myVoice) {
      const myAudioInputStream: LocalAudioStream = new LocalAudioStream(
        (myVoice as any).captureStream().getAudioTracks()[0],
        {
          autoGainControl: true,
          noiseSuppression: true,
        }
      );
      await mememe.publish(myAudioInputStream);
      toast(`音声配信が開始されました`, { icon: "🎤" });
    } else {
      toast.error(
        "音声初期化に何かしらエラーが発生しました。\nページを更新等してお試しください。"
      );
    }
  };

  const joinChannel = async () => {
    if (!Object.keys(JA_CHANNEL_MAPPINGS).includes(myChannelName)) {
      return toast.error("不正チャンネル名です");
    }
    if (!skywayToken) {
      return toast.error("skywayを利用するTokenがありません");
    }
    if (isChannelInitializing) {
      return toast.error("現在チャンネル初期化中です\nこのままお待ち下さい");
    }

    setIsChannelInitializing(() => true);

    try {
      const context = await SkyWayContext.Create(skywayToken);

      myChannel = await SkyWayChannel.FindOrCreate(context, {
        type: 'sfu',
        name: JA_CHANNEL_MAPPINGS[myChannelName],
        metadata: myChannelName,
      });
      mememe = await myChannel.join({
        metadata: myName,
      });
      setIsChannelJoined(() => true);

      startMemberListControl();
      await publishVideoStream();
      await publishAudioStream();
      myChannel.publications.forEach(subscribeAndAttach);
      myChannel.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
      toast.success(
        `トークをお楽しみください。\nここでのあなたの名前は${myName}です！`
      );
    } catch (e) {
      toast.error(
        "チャンネル初期化時にエラーが発生しました。\n3秒後に内部トークンを初期化してトップページへ遷移します。"
      );
      console.log(e);

      setTimeout(() => {
        setSkywayToken("");
        setSkywayJwtForToken("");
        location.href = "/";
      }, 3000);
    }
    setIsChannelInitializing(() => false);
  };

  return (
    <>
      <div className="container">
        <section className={`w-[calc(100%-theme(width.canvas))]`}>
          <div className="flex flex-col text-center w-full mb-10">
            <div className="flex flex-col text-center w-full mb-10">
              <h2 className="text-s text-indigo-500 tracking-widest font-medium title-font mb-1">
                参加チャンネル名
              </h2>
              <h1 className="text-4xl font-medium title-font text-gray-900">
                {myChannelName}
              </h1>
            </div>

            {isChannelJoined && (
              <>
                <p className="text-gray-700 opacity-60">部屋退出時は右上のボタンから退出してください。</p>
                <p className="text-gray-700 opacity-60 mb-10">あなた自身の映像は下に表示されないので、右上配信画面をご確認ください。</p>
              </>
            )}
            {(isChannelJoined && !memberList.length) && (
              <>
                <div className="flex flex-wrap flex-columns justify-center">
                  <div className="bg-gray-100 rounded flex p-4 h-full items-center">
                    <div className="animate-spin h-10 w-10 mr-2 border-4 border-blue-700 rounded-full border-t-transparent"></div>
                    <span className="title-font font-medium">
                      他の人が参加するのを待っています...
                    </span>
                  </div>
                </div>
              </>
            )}
            {!isChannelJoined && (
              <div className="p-2">
                <button
                  onClick={joinChannel}
                  className="flex mx-auto bg-green-500 border-0 px-8 focus:outline-none hover:bg-green-600 rounded disabled:bg-gray-600"
                  disabled={
                    isVideoInputReady && isAudioInputReady ? false : true
                  }
                >
                  {(isVideoInputReady && isAudioInputReady) ? (
                    <p className="text-white text-lg p-2">
                      チャンネルに参加する
                      <span className="block mt-1 text-sm pl-1 pb-2 text-white/80">
                        ※映像&音声の送受信開始
                      </span>
                    </p>
                  ) :
                  <span className="text-white text-lg p-2 inline-block align-middle">
                    カメラと音声が有効になるとチャンネル参加できます
                  </span>
                  }
                </button>
              </div>
            )}
          </div>

          <div
            ref={memberListRef}
            className="grid grid-cols-2 md:grid-cols-3 gap-10"
          >
            {memberList &&
              memberList.map((member) => {
                return (
                  <div
                    key={member.memberId}
                    className={`border-2 border-gray-900 rounded-lg member-${member.memberId}`}
                  >
                    <p className="text-center py-2 text-lx font-bold">{member.memberName}</p>
                    <video autoPlay playsInline muted src="" className="w-full aspect-[3/2]" />
                    <audio autoPlay src="" />
                  </div>
                );
              })}
          </div>
        </section>
      </div>

      <section className="absolute top-0 right-0 m-2">
        <MyVideo ref={myVideoRef} myName={myName} />
      </section>
    </>
  );
}
