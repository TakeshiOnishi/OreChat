import type * as V1VRMSchema from "@pixiv/types-vrmc-vrm-1.0";
import { VRM } from '@pixiv/three-vrm';
import { TFace, Vector, Utils } from "kalidokit";
import * as THREE from "three";

// *Base On* //
// https://github.com/yeemachine/kalidokit/blob/main/docs/script.js#L73
// https://github.com/yeemachine/kalidokit/blob/main/LICENSE.md

const rigRotation = (
  boneName: V1VRMSchema.HumanoidHumanBoneName,
  targetVrm: VRM,
  rotation = { x: 0, y: 0, z: 0 },
  dampener = 1,
  lerpAmount = 0.3
) => {
  if (!targetVrm) {
    return;
  }
  const Part = targetVrm.humanoid.getRawBoneNode(boneName);
  if (!Part) {
    return;
  }

  let euler = new THREE.Euler(
    rotation.x * dampener,
    rotation.y * -dampener,
    rotation.z * -dampener,
    "XYZ"
  );
  let quaternion = new THREE.Quaternion().setFromEuler(euler);
  Part.quaternion.slerp(quaternion, lerpAmount); // interpolate
};


export const rigFace = (targetVrm:VRM, faceResolve:TFace) => {
    if (!targetVrm || !targetVrm.expressionManager) {
        return;
    }
    const expressonManager = targetVrm.expressionManager;
    rigRotation("head", targetVrm, faceResolve.head, 0.7);
    rigRotation("neck", targetVrm, faceResolve.head, 0.7);

    expressonManager.setValue('ih', Vector.lerp(faceResolve.mouth.shape.I, expressonManager.getValue('ih') || 0, 0.5));
    expressonManager.setValue('aa', Vector.lerp(faceResolve.mouth.shape.A, expressonManager.getValue('aa') || 0, 0.5));
    expressonManager.setValue('ee', Vector.lerp(faceResolve.mouth.shape.E, expressonManager.getValue('ee') || 0, 0.5));
    expressonManager.setValue('oh', Vector.lerp(faceResolve.mouth.shape.O, expressonManager.getValue('oh') || 0, 0.5));
    expressonManager.setValue('ou', Vector.lerp(faceResolve.mouth.shape.U, expressonManager.getValue('ou') || 0, 0.5));

    expressonManager.setValue('blinkLeft', Vector.lerp(Utils.clamp(1 - faceResolve.eye.r, 0, 1), expressonManager.getValue('blinkLeft') || 0, 0.5));
    expressonManager.setValue('blinkRight', Vector.lerp(Utils.clamp(1 - faceResolve.eye.l, 0, 1), expressonManager.getValue('blinkRight') || 0, 0.5));
};

export const putArmStraightDown = (targetVrm:VRM) => {
  if (!targetVrm || !targetVrm.expressionManager) {
    return;
  }
  targetVrm.humanoid.setRawPose({
    'rightUpperArm' : {
      rotation: [  0.000,  0.000, -0.454,  0.891 ],
    },
    'leftUpperArm' : {
      rotation: [  0.000,  0.000, 0.454,  0.891 ],
    },
  })
};
