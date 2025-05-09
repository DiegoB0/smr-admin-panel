import React from 'react'
import { useState } from 'react';
import { FaCirclePlus } from "react-icons/fa6";
import { useSelector } from 'react-redux';

function UsersPage() {
  const [isBlogFormOpen, setIsBlogFormOpen] = useState(false)
  const state = useSelector((state) => state);
  const [previewImage, setPreviewImage] = useState(null);

  // Open the modal
  const toggleBlogModal = () => setIsBlogFormOpen(!isBlogFormOpen);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  return (
    <div className="p-8 space-y-12 overflow-y-auto">


      {/* Mis Blogs */}

      <div className='mb-2 flex justify-between w-full'>

        <h2 className='text-xl font-bold mb-4 text-gray-900 uppercase'>Usuarios</h2>
        <button
          type="submit"
          className='flex gap-2 py-2 px-3 bg-gray-900 text-white rounded-xl font-semibold'
          onClick={toggleBlogModal}
        >
          Nuevo
          <span className='mt-1'>
            <FaCirclePlus />
          </span>
        </button>
      </div>

      <div className='border border-gray-300 p-2 rounded-xl'>

        <h2 className="text-xl font-semibold mb-4 text-gray-900 border-l-3 border-red-700 px-2">Registros</h2>
        <div className="overflow-x-auto rounded-xl shadow">


          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2 text-gray-600">Perfil</th>
                <th className="px-4 py-2 text-gray-600">Nombre</th>
                <th className="px-4 py-2 text-gray-600">Email</th>
                <th className="px-4 py-2 text-gray-600">Roles</th>
                <th className="px-4 py-2 text-gray-600">Status</th>
                <th className="px-4 py-2 text-gray-600">Acciones</th>

              </tr>

            </thead>
            <tbody>
              {/* Insert rows here */}
            </tbody>

          </table>
        </div>
      </div>



      {/* Modal */}
      {isBlogFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 text-white rounded-xl shadow-xl w-1/2 max-w-lg p-6 relative">
            <h3 className="text-xl font-semibold mb-4">Nuevo Usuario</h3>

            <form>
              <div className="mb-4 flex gap-4">
                {/* Nombre */}
                <div className="w-1/2">
                  <label htmlFor="nombre" className="block text-sm font-medium text-white">
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    placeholder="Escribe el nombre"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none"
                  />
                </div>

                {/* Email */}

                <div className="w-1/2">
                  <label htmlFor="email" className="block text-sm font-medium text-white">

                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="Escribe el email"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none"
                  />
                </div>
              </div>

              <div className='flex gap-4 my-4'>
                {/* Contraseña */}
                <div className="w-1/2">
                  <label htmlFor="password" className="block text-sm font-medium text-white">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Escribe la contraseña"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none"
                  />
                </div>

                {/* Confirmar Contraseña */}
                <div className="w-1/2">

                  <label htmlFor="confirm-password" className="block text-sm font-medium text-white">

                    Confirmar Contraseña
                  </label>
                  <input

                    id="confirm-password"
                    type="password"
                    placeholder="Confirmar contraseña"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none"
                  />
                </div>
              </div>


              <div className="mb-4 flex gap-4">
                {/* Select Input */}
                <div className="w-full">
                  <label htmlFor="categoria" className="block text-sm font-medium text-white">
                    Roles
                  </label>
                  <select
                    id="categoria"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none appearance-none"

                  >
                    <option value="" disabled selected className="bg-gray-900 text-white hover:bg-gray-700">
                      Selecciona un rol
                    </option>
                    <option value="categoria1" className="bg-gray-900 text-white">
                      Categoría 1
                    </option>
                    <option value="categoria2" className="bg-gray-900 text-white">
                      Categoría 2
                    </option>
                    <option value="categoria3" className="bg-gray-900 text-white">
                      Categoría 3
                    </option>
                  </select>
                </div>
              </div>


              <div className="mb-4">
                <label htmlFor="imagen" className="block text-sm font-medium text-white">
                  Imagen de perfil
                </label>
                <input
                  id="imagen"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e)}
                  className="w-full mt-1 text-white file:bg-gray-700 file:border-0 file:rounded-xl file:px-4 file:py-2 file:text-white file:cursor-pointer"
                />

                {/* Image Preview */}
                {previewImage && (
                  <div className="mt-4">
                    <img

                      src={previewImage}
                      alt="Preview"
                      className="max-h-24 w-auto rounded-xl border border-gray-700"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={toggleBlogModal}
                  className="text-red-500 border border-transparent hover:border-red-500 py-2 px-4 rounded-xl transition-colors duration-200"
                >
                  Cerrar

                </button>

                <button
                  type="submit"
                  className="bg-gray-800 py-2 px-4 rounded-xl hover:bg-gray-700 transition-colors duration-200"
                >
                  Enviar

                </button>
              </div>
            </form>


            {/* Optional Close (X) button */}
            <button
              onClick={toggleBlogModal}
              className="absolute top-3 right-4 text-gray-400 hover:text-white text-xl"
            >

              &times;
            </button>
          </div>
        </div>
      )}





    </div >
  );
}

export default UsersPage;

