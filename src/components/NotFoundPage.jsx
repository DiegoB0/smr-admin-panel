import React from "react";
import { useNavigate } from "react-router-dom";
import image from "../assets/ingeniero-png.png"
import { IoMdArrowRoundBack } from "react-icons/io";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  const isAuthenticated = () => {
    return !!localStorage.getItem("auth_token");
  };

  const handleRedirect = () => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    } else {
      navigate("/auth/login");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-800">
      <div className="mb-10 flex flex-col gap-2 items-center">
        <h1 className="text-8xl font-extrabold text-gray-500">404</h1>
        <div className="flex gap-4">
          <h1 className="text-8xl text-gray-300 mb-2 text-extrabold">Oops!</h1>
          <img src={image} alt="Engineer" className="w-50 h-auto mb-6" />
        </div>
      </div>
      <button
        onClick={handleRedirect}
        className="px-6 py-3 bg-black flex gap-2 text-white font-semibold rounded-md hover:bg-gray-700 transition duration-300 ease-in-out"
      >
        <span className="mt-1">
          <IoMdArrowRoundBack />
        </span>
        {isAuthenticated() ? "Regresar al dashboard" : "Regresar"}
      </button>
    </div>
  );
};

