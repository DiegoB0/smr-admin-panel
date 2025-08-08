import React from "react";
import { useSelector } from "react-redux";
import { hasRole } from "../../guards/authGuards";
import { Roles } from '../../guards/authEnums';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const user = useSelector(state => state?.auth?.user)
  const isAdmin = useSelector(s => hasRole(s, Roles.ADMIN));
  const isOperador = useSelector(s => hasRole(s, Roles.OPERADOR));
  const isAdminAlmacen = useSelector(s => hasRole(s, Roles.ADMIN_ALMACEN));
  const isBlogger = hasRole(s => hasRole(s, Roles.BLOGGER));
  const isAdminWeb = hasRole(s => hasRole(s, Roles.ADMIN_WEB))

  const navigate = useNavigate();

  return (
    <div className="flex justify-center  bg-gray-100 mt-4">
      <div className="text-center p-6 bg-white shadow-lg rounded-lg max-w-lg w-full">
        <h1 className="text-4xl font-bold text-gray-800">
          Bienvenido, {user?.name ?? "Guest"}!
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          {isBlogger
            ? "¿Listo para hacer un nuevo post?"
            : isAdmin
              ? "Eres un Administrador."
              : isAdminWeb
                ? "Eres un Administrador Web."
                : isAdminAlmacen
                  ? "Administrar nuevos reportes"
                  : isOperador
                    ? "Ver mis reportes"
                    : 'Por favor inicia sesion.'
          }
        </p>
        {isBlogger && (

          <button
            onClick={() => {
              navigate('/dashboard/blogs');
            }}
            className="mt-6 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors duration-300 ease-in-out"
          >
            Ir a los blogs
          </button>
        )}

        {isAdmin && (
          <p className="mt-4 text-lg text-gray-600">
            ¡Acceso completo como Administrador!
          </p>
        )}

      </div>
    </div>
  );
}

export default HomePage;

