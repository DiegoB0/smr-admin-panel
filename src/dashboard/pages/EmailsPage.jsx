import React from 'react'


function EmailsPage() {

  return (
    <div className="p-8 space-y-12 overflow-y-auto">
      <div className='mb-2 flex justify-between w-full'>

        <h2 className='text-xl font-bold mb-4 text-gray-900 uppercase'>Correos</h2>

      </div>
      <div className='border border-gray-300 p-2 rounded-xl'>

        <h2 className="text-xl font-semibold mb-4 text-gray-900 border-l-3 border-red-700 px-2">Registros</h2>
        <div className="overflow-x-auto rounded-xl shadow">

          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2 text-gray-600">Nombre</th>
                <th className="px-4 py-2 text-gray-600">Mensaje</th>
                <th className="px-4 py-2 text-gray-600">Marcar como leido</th>
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

export default EmailsPage
