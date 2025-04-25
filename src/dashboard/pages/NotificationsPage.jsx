import React from 'react'
import { useState } from 'react';
import { FaCirclePlus } from "react-icons/fa6";

function NotificationsPage() {
  const [isBlogFormOpen, setIsBlogFormOpen] = useState(false)

  // Open the modal
  const toggleBlogModal = () => setIsBlogFormOpen(!isBlogFormOpen);


  return (
    <div className="p-8 space-y-12 overflow-y-auto">


      {/* Mis Blogs */}

      <div className='mb-2 flex justify-between w-full'>

        <h2 className='text-xl font-bold mb-4 text-gray-900 uppercase'>Notificaciones</h2>
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
                <th className="px-4 py-2 text-gray-600">Titulo</th>
                <th className="px-4 py-2 text-gray-600">Mensaje</th>
                <th className="px-4 py-2 text-gray-600">Creador</th>
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
            <h3 className="text-xl font-semibold mb-4">Nueva Notificacion</h3>

            <form>
              <div className="mb-4 flex gap-4">
                <div className="w-full">
                  <label htmlFor="title" className="block text-sm font-medium text-white">
                    Titulo
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Escribe el titulo"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none"
                  />
                </div>

              </div>

              <div className="mb-4">
                <label htmlFor="mensaje" className="block text-sm font-medium text-white">
                  Mensaje
                </label>
                <textarea
                  id="mensaje"

                  placeholder="Escribe un mensaje..."
                  rows={5}
                  className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none resize-none overflow-y-auto"
                ></textarea>
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

export default NotificationsPage;

