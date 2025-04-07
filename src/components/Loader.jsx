import React from "react"
import { ImSpinner2 } from "react-icons/im"

export const Loader = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <ImSpinner2 className="animate-spin text-4xl text-red-500" />
    </div>)
}
