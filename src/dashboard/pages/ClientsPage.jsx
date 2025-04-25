import React from 'react'
import { IoIosNotifications } from "react-icons/io";
import { IoMdMail } from "react-icons/io";
import { useNavigate } from 'react-router-dom';


function ClientsPage() {

  const navigate = useNavigate();

  return (
    <div className="p-8 space-y-12 overflow-y-auto">
      <div className='mb-2 flex justify-between w-full'>

        <h2 className='text-xl font-bold mb-4 text-gray-900 uppercase'>Clientes</h2>

        <div className='flex gap-2'>

          <button
            type="submit"
            className='flex gap-2 py-2 px-3 bg-gray-900 text-white rounded-xl font-semibold'
            onClick={() => {
              navigate('/dashboard/emails');
            }}
          >
            <span className='mt-1'>
              <IoMdMail />
            </span>
            Ver correos
          </button>

          <button
            type="submit"
            className='flex gap-2 py-2 px-3 bg-gray-900 text-white rounded-xl font-semibold'
            onClick={() => {
              navigate('/dashboard/notifications');
            }}
          >

            Crear notificacion
            <span className='mt-1'>
              <IoIosNotifications />
            </span>
          </button>

        </div>
      </div>
      <div className='border border-gray-300 p-2 rounded-xl'>

        <h2 className="text-xl font-semibold mb-4 text-gray-900 border-l-3 border-red-700 px-2">Registros</h2>
        <div className="overflow-x-auto rounded-xl shadow">

          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2 text-gray-600">Nombre</th>
                <th className="px-4 py-2 text-gray-600">Correo</th>
                <th className="px-4 py-2 text-gray-600">Es notificado</th>
                <th className="px-4 py-2 text-gray-600">Acciones</th>

              </tr>

            </thead>
            <tbody>
              {/* Insert rows here */}
            </tbody>

          </table>
        </div>

      </div>


    </div>
  )
}

export default ClientsPage
