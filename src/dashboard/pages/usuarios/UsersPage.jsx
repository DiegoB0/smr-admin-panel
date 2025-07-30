import React, { useEffect } from 'react'
import { useState } from 'react';
import { FaCirclePlus } from "react-icons/fa6";
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { useAuthFlags } from '../../../hooks/useAuth';
import { useUser } from '../../../hooks/useUser';
import { useDebounce } from '../../../hooks/customHooks';
import Swal from 'sweetalert2';

function UsersPage() {
  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null);
  const { canCreateUsers, canDeleteUsers, canEditUsers } = useAuthFlags();

  const { listUsers, createUser, listRoles } = useUser();

  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState('5');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const limit = limitOption === "all" ? pagination.totalItems || 0 : parseInt(limitOption, 10)

  // Input search

  // Fields for the form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Roles
  const [roleOptions, setRoleOptions] = useState([]);
  const [selectedRole, setSelectedRol] = useState('');

  // Fetch roles
  useEffect(() => {
    setLoading(true);
    listRoles()
      .then(res => {
        setRoleOptions(res.data);
      })
      .catch(err => {
        console.log(err)
        Swal.fire({
          title: 'Error',
          text: err.message || 'Fallo al traer roles',
          icon: 'error',
          confirmButtonColor: '#1F2937',
          confirmButtonText: 'Ok',
        });
      })
      .finally(() => setLoading(false));

  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // Fetch users
  useEffect(() => {
    setLoading(true);
    listUsers(
      {
        page,
        limit,
        search: debouncedSearchTerm,
        order: 'ASC'
      }
    )
      .then(res => {
        setUsers(res.data.data)
        setPagination(res.data.meta)
      })
      .catch(err => {
        console.log(err)
        Swal.fire({
          title: 'Error',
          text: err.message || 'Fallo al traer usuarios',
          icon: 'error',
          confirmButtonColor: '#1F2937',
          confirmButtonText: 'Ok',
        });
      })
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearchTerm]);

  const toggleUsersModal = () => setIsUserFormOpen(!isUserFormOpen);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'Las contrasenas no coinciden',
        icon: 'error',
        confirmButtonColor: '#1F2937',
        confirmButtonText: 'Ok',
      });
      return
    }

    const payload = {
      name,
      email,
      password,
      image: '',
      roles: selectedRole ? [selectedRole] : [],
    };

    try {
      const { data: newUser } = await createUser(payload);
      console.log('User created: ', newUser);

      Swal.fire({
        title: '¡Nuevo Usuario!',
        text: 'Se ha registrado un nuevo usuario',
        icon: 'success',
        confirmButtonColor: '#1F2937',
        confirmButtonText: 'Ok',
      }).then(() => {
        setUsers(prevUsers => [newUser, ...prevUsers]);
        clearForm();
      });

    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: err.message || 'Fallo al registrar usuario',
        icon: 'error',
        confirmButtonColor: '#1F2937',
        confirmButtonText: 'Ok',
      });
    }

    setIsUserFormOpen(!isUserFormOpen);

  };

  const handleCloseModal = () => {
    setIsUserFormOpen(!isUserFormOpen);
    clearForm();
  }

  const handleSearchChange = e => {
    setSearchTerm(e.target.value)
    setLoading(true)
  }

  const clearForm = () => {
    setName('')
    setPassword('')
    setConfirmPassword('')
    setEmail('')
    setSelectedRol('')
  };

  return (
    <div className="p-8 space-y-12 overflow-y-auto">

      <div className='mb-2 flex justify-between w-full'>

        <h2 className='text-xl font-bold mb-4 text-gray-900 uppercase'>Usuarios</h2>
        {
          canCreateUsers && (
            <button
              type="submit"
              className='flex gap-2 py-2 px-3 bg-gray-900 text-white rounded-xl font-semibold'
              onClick={toggleUsersModal}
            >
              Nuevo
              <span className='mt-1'>
                <FaCirclePlus />
              </span>
            </button>
          )
        }
      </div>

      <div className='border border-gray-300 p-2 rounded-xl'>


        <div className="flex gap-4 items-center justify-end">

          <select
            value={limitOption}
            onChange={e => setLimitOption(e.target.value)}
            className="px-2 py-1 border rounded"
          >
            <option value="5"> 5 </option>
            <option value="10"> 10 </option>
            <option value="20"> 20 </option>
            <option value="all"> TODOS </option>
          </select>

          <input
            type="text"
            placeholder="Buscar usuarios…"
            value={searchTerm}
            onChange={handleSearchChange}
            className="px-3 py-1 border rounded"
          />
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-l-3 border-red-700 px-2">
          <span className='text-lg'> ({pagination.totalItems}) </span> REGISTROS
        </h2>
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-100 text-center text-base uppercase font-semibold">
              <tr>
                <th className="px-4 py-2 text-gray-600">Foto Perfil</th>
                <th className="px-4 py-2 text-gray-600">Nombre</th>
                <th className="px-4 py-2 text-gray-600">Email</th>
                <th className="px-4 py-2 text-gray-600">Roles</th>
                <th className="px-4 py-2 text-gray-600">Status</th>
                <th className="px-4 py-2 text-gray-600 text-right">Acciones</th>

              </tr>

            </thead>
            <tbody>
              {loading
                ?
                (
                  <tr className='animate-pulse'>
                    <td className='p-2  h-4 bg-gray-200 text-gray-600'>Cargando... </td>
                    <td className='p-2  h-4 bg-gray-200 text-gray-600'>Cargando... </td>
                    <td className='p-2  h-4 bg-gray-200 text-gray-600'>Cargando... </td>
                    <td className='p-2  h-4 bg-gray-200 text-gray-600'>Cargando... </td>
                    <td className='p-2  h-4 bg-gray-200 text-gray-600'>Cargando... </td>
                    <td className='p-2  h-4 bg-gray-200 text-gray-600'>Cargando... </td>

                  </tr>
                )
                :
                users.length > 0 ? (
                  users.map(u => (
                    <tr key={u.id} className=' text-center'>
                      <td className=' text-lg'> Not yet </td>
                      <td className='mt-2 text-lg'> {u.name} </td>
                      <td className='mt-2 text-lg'> {u.email} </td>
                      <td className='mt-2 text-lg'> {u.roles} </td>
                      <td className='mt-2 text-lg'> 
                        {u.isActive ? 'Activo' : 'No activo'}
                      </td>
                      <td className='flex mt-2 gap-2 justify-end'>
                        {
                          canDeleteUsers && (
                            <button className='rounded-md px-2 py-1 text-lg font-medium text-red-700 border-2 border-red-700 hover:bg-red-700 hover:text-white transition-colors duration-200 hover:border-transparent' onClick={() => console.log('Deleted!')}> Eliminar </button>
                          )
                        }
                        {
                          canEditUsers && (
                            <button className='text-white rounded-md font-medium px-6 py-1 bg-blue-700 text-lg hover:bg-blue-600 transition-colors duration-200' onClick={() => console.log('Edit')}> Editar </button>
                          )
                        }
                      </td>
                    </tr>
                  ))
                ) :
                  (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-4 text-lg font-medium text-center text-gray-500 italic"
                      >
                        No se encontraron resultados.
                      </td>
                    </tr>
                  )
              }
            </tbody>

          </table>

          <div className='flex justify-center mt-4 p-4'>
            <button
              onClick={() => setPage(prev => prev - 1)}
              disabled={!pagination.hasPreviousPage}
              className="bg-gray-900 text-white font-medium text-xl rounded-md px-4 py-2 border rounded disabled:opacity-50"
            >
              Anterior
            </button>

            <span className='px-4 py-3'>
              Pagina {pagination.currentPage} de {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={!pagination.hasNextPage}
              className="bg-gray-900 text-white font-medium text-lg rounded-md px-4 py-2 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>


          </div>

        </div>
      </div>



      {/* Modal */}
      {isUserFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCloseModal}
        >
          <div className="bg-gray-900 text-white rounded-xl shadow-xl w-1/2 max-w-lg p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Nuevo Usuario</h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4 flex gap-4">
                {/* Nombre */}
                <div className="w-1/2">
                  <label htmlFor="nombre" className="block text-sm font-medium text-white">
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Escribe el nombre"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none"
                    required
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
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Escribe el email"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none"
                    required
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
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Escribe la contraseña"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none"
                    required
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
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar contraseña"
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none"
                    required
                  />
                </div>
              </div>

              {/* Select Input */}
              <div className="mb-4 flex gap-4">
                <div className="w-full">
                  <label htmlFor="categoria" className="block text-sm font-medium text-white">
                    Roles
                  </label>
                  <select
                    id="roles"
                    value={selectedRole}
                    onChange={e => setSelectedRol(e.target.value)}
                    className="w-full mt-1 p-2 bg-transparent text-white border border-gray-600 rounded-xl outline-none ring-0 focus:ring-1 focus:ring-white focus:border-white transition-all shadow-none appearance-none"
                  >
                    {roleOptions.map(role => (
                      <option
                        key={role.id}
                        value={role.id}
                        className='bg-gray-900 text-white'
                      >
                        {role.name}
                      </option>
                    ))}
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
                  onClick={handleCloseModal}
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
              onClick={handleCloseModal}
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
