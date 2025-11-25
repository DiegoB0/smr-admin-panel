"use client"

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ChevronLeft,
} from 'lucide-react'

export const NotificacionesAlmacenPage = () => {

  const navigate = useNavigate();

  return (

    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-inter">

      <div className="mb-8 flex justify-between items-center">
        <div>
          <button
            className="flex gap-2 items-center"
            onClick={() => navigate(`/dashboard/almacenes/`)}
          >
            <span className="text-gray-500">
              <ChevronLeft />
            </span>
            <h1 className="text-gray-600 uppercase text-lg">Regresar</h1>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600 mt-1">
            Ve las peticiones que te hacen otros almacenes sobre tus productos
          </p>
        </div>

      </div>
    </div>

  )
}
