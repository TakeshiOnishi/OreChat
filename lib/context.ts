import { atom, } from "recoil";
import { recoilPersist } from 'recoil-persist'

const { persistAtom } = recoilPersist()

export const skywayTokenState = atom({
  key: 'skywayToken',
  default: '',
  effects_UNSTABLE: [persistAtom],
});

export const skywayJwtForTokenState = atom({
  key: 'skywayJwtForToken',
  default: '',
  effects_UNSTABLE: [persistAtom],
});

export const myChannelNameState = atom({
  key: 'myChannelName',
  default: '',
  effects_UNSTABLE: [persistAtom],
});

export const isVideoInputReadyState = atom({
  key: 'isVideoInputReady',
  default: false,
});

export const isAudioInputReadyState = atom({
  key: 'isAudioInputReady',
  default: false,
});

export const isLiveStreamingState = atom({
  key: 'isLiveStreaming',
  default: false,
});

export const myVoicePitchState = atom({
  key: 'myVoicePitch',
  default: -6,
  effects_UNSTABLE: [persistAtom],
});

export const isMyVoiceCheckEnableState = atom({
  key: 'isMyVoiceCheckEnable',
  default: true,
  effects_UNSTABLE: [persistAtom],
});
