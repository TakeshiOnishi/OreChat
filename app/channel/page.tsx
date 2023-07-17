"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

export default function Channel() {
  let DynamicComponent = dynamic(() => import("./dynamicComponent"), {
    ssr: false,
  });
  useEffect(() =>{
  },[])

  return (
    <>
      {<DynamicComponent />}
    </>
  )
}
