"use client";
import { Face } from "kalidokit";
import { WebGLRenderer } from "three";
import { useState, useEffect, useRef, forwardRef, ChangeEvent } from "react";
import * as THREE from "three";

import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
  FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRM, VRMLoaderPlugin } from "@pixiv/three-vrm";
import * as Tone from "tone";
import { rigFace, putArmStraightDown } from "@/lib/controlVRM";
import { useRecoilState } from "recoil";
import { isVideoInputReadyState, isAudioInputReadyState, myVoicePitchState, isMyVoiceCheckEnableState } from "@/lib/context";

type MyVideoProps = {
  myName: string;
};

const MyVideo = forwardRef<HTMLElement, MyVideoProps>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLVideoElement>(null);
  const avatarCanvasRef = useRef<HTMLCanvasElement>(null);
  const meshCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestAnimationFrameRef = useRef<number>(0);
  const CANVAS_SIZE = { width: 300, height: 200 };
  const [pitchShifter, setPitchShifter] = useState<Tone.PitchShift>();
  const [lastVideoTime, setLastVideoTime] = useState(-1);
  const [myVoicePitch, setMyVoicePitch] = useRecoilState(myVoicePitchState);
  const [isMyVoiceCheckEnable, setIsMyVoiceCheckEnable] = useRecoilState(isMyVoiceCheckEnableState);
  const [_isVideoInputReady, setIsVideoInputReady] = useRecoilState(isVideoInputReadyState);
  const [_isAudioInputReady, setIsAudioInputReady] = useRecoilState(isAudioInputReadyState);

  let faceLandmarker: FaceLandmarker;
  let loadedVrm: VRM;
  let threeScene: THREE.Scene;
  let threeCamera: THREE.PerspectiveCamera;
  let modelLoader: GLTFLoader;
  let meshCanvasCtx: CanvasRenderingContext2D;
  let meshDrawingUtils: DrawingUtils;
  let renderer: WebGLRenderer;

  useEffect(() => {
    initializeTakagiAndThree();
    (async () => {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: CANVAS_SIZE.width,
          height: CANVAS_SIZE.height,
        },
      });
      videoRef.current!.srcObject = new MediaStream(
        mediaStream.getVideoTracks()
      );
      initializeVoiceChanger(mediaStream);
      initializeMediaVisionTask();
    })();
    return () => cancelAnimationFrame(requestAnimationFrameRef.current);
  }, []);

  const initializeVoiceChanger = async (mediaStream: MediaStream) => {
    const micAudio = new Tone.UserMedia();
    await micAudio.open();
    const shifter = new Tone.PitchShift(myVoicePitch);
    micAudio.connect(shifter);
    setPitchShifter(shifter);

    const effectedDest = Tone.context.createMediaStreamDestination();
    shifter.connect(effectedDest);

    const oldTrack = mediaStream.getAudioTracks()[0];
    mediaStream.removeTrack(oldTrack);
    const effectedTrack = effectedDest.stream.getAudioTracks()[0];
    mediaStream.addTrack(effectedTrack);
    audioRef.current!.srcObject = new MediaStream(mediaStream.getAudioTracks());
    setIsAudioInputReady(true)
  };

  const initializeTakagiAndThree = () => {
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0xcccccc);
    modelLoader = new GLTFLoader();
    threeCamera = new THREE.PerspectiveCamera(
      50,
      innerWidth / innerHeight,
      0.1,
      2000
    );
    threeCamera.position.y = 78;
    threeCamera.position.z = 25;
    threeScene.add(threeCamera);

    renderer = new THREE.WebGLRenderer({
      canvas: avatarCanvasRef.current!,
    });

    modelLoader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });
    modelLoader.load(
      "/vj_takagi.vrm",
      (gltf) => {
        loadedVrm = gltf.userData.vrm;
        loadedVrm.scene.rotation.y = Math.PI;
        loadedVrm.scene.scale.setScalar(50);
        putArmStraightDown(loadedVrm);
        threeScene.add(loadedVrm.scene);

        const light = new THREE.PointLight(0xffffff);
        light.position.set(2, 2, 2); // ライトの位置を設定
        threeScene.add(light);
        renderer.setSize(CANVAS_SIZE.width, CANVAS_SIZE.height);
        renderer.render(threeScene, threeCamera);
      },
      (progress) =>
        console.log(
          "Loading model...",
          100.0 * (progress.loaded / progress.total),
          "%"
        ),
      (error) => console.error(error)
    );
  };

  const initializeMediaVisionTask = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU",
      },
      numFaces: 1,
      runningMode: "VIDEO",
    });
    meshCanvasCtx = meshCanvasRef.current?.getContext("2d")!;
    meshDrawingUtils = new DrawingUtils(meshCanvasCtx);
    renderLoop();
    setIsVideoInputReady(true);
  };

  const renderLoop = () => {
    let nowInMs = Date.now();
    const videoRefCurrent = videoRef.current!;
    if (videoRefCurrent && videoRefCurrent.currentTime !== lastVideoTime) {
      setLastVideoTime(videoRefCurrent.currentTime);
      const faceLandmarkerResult = faceLandmarker!.detectForVideo(
        videoRefCurrent,
        nowInMs
      );

      meshDraw(meshDrawingUtils, faceLandmarkerResult);
      applyRealFace2Virtual(faceLandmarkerResult);
    }

    requestAnimationFrameRef.current = requestAnimationFrame(renderLoop);
  };

  const meshDraw = (
    drawingUtils: DrawingUtils,
    faceLandmarkerResult: FaceLandmarkerResult
  ) => {
    const commonDrawParams = { lineWidth: 0.8 };
    meshCanvasCtx.clearRect(
      0,
      0,
      meshCanvasRef.current!.width,
      meshCanvasRef.current!.height
    );
    if (faceLandmarkerResult.faceLandmarks) {
      for (const landmarks of faceLandmarkerResult.faceLandmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: "#C0C0C070", ...commonDrawParams }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          { color: "#FF3030", ...commonDrawParams }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
          { color: "#FF3030", ...commonDrawParams }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          { color: "#30FF30", ...commonDrawParams }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
          { color: "#30FF30", ...commonDrawParams }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
          { color: "#E0E0E0", ...commonDrawParams }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LIPS,
          { color: "#E0E0E0", ...commonDrawParams }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
          { color: "#FF3030", ...commonDrawParams }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
          { color: "#30FF30", ...commonDrawParams }
        );
      }
    }
  };

  const applyRealFace2Virtual = (
    faceLandmarkerResult: FaceLandmarkerResult
  ) => {
    if (!faceLandmarkerResult) {
      return;
    }

    const faceResolved = Face.solve(faceLandmarkerResult.faceLandmarks[0]);
    if (faceResolved) {
      rigFace(loadedVrm, faceResolved);
      try {
        loadedVrm.expressionManager?.update();
      } catch (e) {
        console.log(e);
      }
    }
    renderer.render(threeScene, threeCamera);
  };

  const handleVoicePitch = (e: ChangeEvent<HTMLInputElement>) => {
    setMyVoicePitch(parseFloat(e.target.value));
    if (pitchShifter) {
      pitchShifter.pitch = parseFloat(e.target.value);
    }
  };

  return (
    <section ref={ref}>
      <a href="/">
        <div className="bg-yellow-500 rounded-lg mb-2 text-center hover:bg-yellow-200 cursor">
          トップページに戻る
        </div>
      </a>

      <div className="border-2 border-gray-700 rounded-lg mb-2 text-center">
        <h3 className="p-3 pb-0">俺としての貴方 : <span className="font-bold">{props.myName}</span></h3>
        <p className="text-gray-600 text-sm p-3 pt-0">
          ※この画面が相手に映ります
        </p>
        <canvas
          className="refAvatarCanvas w-full h-full"
          ref={avatarCanvasRef}
        />
      </div>
      <div className="relative border-2 border-gray-700 rounded-lg mb-2 text-center">
        <h3 className="p-3 pb-0"> 現実の貴方</h3>
        <p className="text-gray-600 text-sm p-3 pt-0">
          ※これは相手に映りません
        </p>
        <canvas className="absolute w-canvas h-canvas" ref={meshCanvasRef} />
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          src=""
          className=" w-canvas h-canvas"
        />
      </div>
      <div className="relative border-2 border-gray-700 rounded-lg p-3">
        <h3>Voice Pitch</h3>
        <audio className="refMyVoice" ref={audioRef} autoPlay src="" muted={!isMyVoiceCheckEnable}  />
        <input
          type="range"
          min="-20"
          max="20"
          step="0.5"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mb-3"
          defaultValue={myVoicePitch}
          onChange={handleVoicePitch}
        />
        <div className="flex items-center">
          <input id="checked-checkbox" type="checkbox" value="" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500focus:ring-2" checked={isMyVoiceCheckEnable} onChange={() => setIsMyVoiceCheckEnable(!isMyVoiceCheckEnable)} />
          <label htmlFor="checked-checkbox" className="ml-2 text-sm font-medium text-gray-600">自分の声を聞いて確認</label>
        </div>
      </div>
    </section>
  );
});

export default MyVideo;
