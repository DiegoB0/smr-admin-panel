import React, { useState } from 'react';
import { IoStorefront } from "react-icons/io5";
import { TbWorld } from "react-icons/tb";
import { HiUsers } from "react-icons/hi2";
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../hooks/useAuth';
import { FaPaperPlane } from "react-icons/fa6";
import { FaHome } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { MdEmail } from "react-icons/md";
import { MdKeyboardArrowUp } from "react-icons/md";
import { PiSignOutBold } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import { hasRole, canAccessResource } from '../../guards/authGuards';
import { Roles } from '../../guards/authEnums';

function Sidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenWeb, setIsOpenWeb] = useState(false)
  const [isOpenAlmacen, setIsOpenAlmacen] = useState(false)
  const location = useLocation(); // To detect the current page
  const state = useSelector((state) => state)
  const dispatch = useDispatch();

  // Function to toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };


  const toggleDropdownWeb = () => {
    setIsOpenWeb(!isOpenWeb);
  };

  const toggleDropdownAlmacen = () => {
    setIsOpenAlmacen(!isOpenAlmacen)
  }


  const handleLogout = () => {
    // Use the Redux logout function
    logoutUser(dispatch);
    // Redirect to login page
    navigate('/auth/login');
  };

  return (
    <div className="w-[300px] bg-gray-900 text-white h-screen flex flex-col overflow-y-auto">
      <div className='flex justify-center items-center'>
        <h1 className='text-2xl text-gray-200 font-extrabold'>SMR Admin<span className='text-6xl text-red-600'>.</span></h1>
      </div>
      <div className='flex flex-col justify-around h-full'>
        <nav className="flex-1 px-4 py-6">
          <ul>
            {/* Home link with active indicator */}

            <li>
              <Link
                to="/dashboard"
                className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === '/dashboard' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                  }`}
              >
                <span className='mt-1'>
                  <FaHome />
                </span>
                Home
              </Link>
            </li>


            {
              canAccessResource('post', 'create', null, state) && (
                <li>
                  <Link
                    to="/dashboard/blogs"
                    className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === '/dashboard/blogs' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                      }`}
                  >
                    <span className='mt-1'>
                      <FaPaperPlane />
                    </span>
                    Blogs
                  </Link>
                </li>
              )
            }

            {
              canAccessResource('user', 'read', null, state) && (
                <li>
                  <Link
                    to="/dashboard/users"
                    className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === '/dashboard/users' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                      }`}
                  >
                    <span className='mt-1'>
                      <HiUsers />
                    </span>
                    Usuarios
                  </Link>
                </li>
              )
            }

            {
              hasRole(Roles.ADMIN, state) && (
                <li>
                  <button
                    className={`block w-full py-2 px-4 text-left rounded-md mb-2 hover:border-l-2 border-red-600 ${isOpenAlmacen ? 'border-l-2' : ''}`}
                    onClick={toggleDropdownAlmacen}
                  >
                    <div className='flex gap-2'>
                      <span className='mt-1'>
                        <IoStorefront />
                      </span>
                      <div className='flex gap-2 justify-between w-3/4'>
                        Administrar almacen
                        <span className='mt-1'>
                          <MdKeyboardArrowUp
                            className={`transition-transform duration-300 ${isOpenAlmacen ? '-rotate-180' : 'rotate-0'}`}
                          />
                        </span>
                      </div>
                    </div>
                  </button>
                  {isOpenAlmacen && (
                    <ul className="pl-4">
                      <li>
                        <Link
                          to="/dashboard/requisiciones"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option1' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Requisiciones
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/dashboard/emails"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option2' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
      
                          Entradas
                        </Link>
                      </li>

                      <li>
                        <Link
                          to="/dashboard/notifications"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option2' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Salidas
                        </Link>
                      </li>

                      <li>
                        <Link
                          to="/dashboard/notifications"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option2' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Productos
                        </Link>
                      </li>


                      <li>
                        <Link
                          to="/dashboard/notifications"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option2' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Obras
                        </Link>
                      </li>
                    {/*  AGREGAR ESTE NUEVO ENLACE AQUÍ */}
                       <li>
                        <Link
                          to="/dashboard/almacenes"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${
                          location.pathname === '/dashboard/almacenes' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                          }`}
                          >
                            Almacenes
                          </Link>
                        </li>
                        {/* 👆 NUEVO ENLACE AGREGADO */}

                      <li>
                        <Link
                          to="/dashboard/notifications"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option2' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Historial
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              )
            }


            {
              hasRole(Roles.ADMIN, state) && (
                <li>
                  <button
                    className={`block w-full py-2 px-4 text-left rounded-md mb-2 hover:border-l-2 border-red-600 ${isOpen ? 'border-l-2' : ''}`}
                    onClick={toggleDropdown}
                  >
                    <div className='flex gap-2'>
                      <span className='mt-1'>
                        <MdEmail />
                      </span>

                      <div className='flex gap-2 justify-between w-3/4'>
                        Administrar emails
                        <span className='mt-1'>
                          <MdKeyboardArrowUp
                            className={`transition-transform duration-300 ${isOpen ? '-rotate-180' : 'rotate-0'}`}
                          />
                        </span>
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <ul className="pl-4">
                      <li>
                        <Link
                          to="/dashboard/clients"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option1' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Clientes
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/dashboard/emails"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option2' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Correos
                        </Link>
                      </li>

                      <li>
                        <Link
                          to="/dashboard/notifications"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option2' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Notificaciones
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              )
            }


            {
              hasRole([Roles.ADMIN, Roles.ADMIN_WEB], state) && (
                <li>
                  <button
                    className={`block w-full py-2 px-4 text-left rounded-md mb-2 hover:border-l-2 border-red-600 ${isOpenWeb ? 'border-l-2' : ''}`}
                    onClick={toggleDropdownWeb}
                  >
                    <div className='flex gap-2'>
                      <span className='mt-1'>
                        <TbWorld />
                      </span>

                      <div className='flex gap-2 justify-between w-3/4'>
                        Administrar web
                        <span className='mt-1'>
                          <MdKeyboardArrowUp
                            className={`transition-transform duration-300 ${isOpenWeb ? '-rotate-180' : 'rotate-0'}`}
                          />
                        </span>
                      </div>
                    </div>
                  </button>
                  {isOpenWeb && (
                    <ul className="pl-4">
                      <li>
                        <Link
                          to="/dashboard/testimonials"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option1' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Testimonios
                        </Link>
                      </li>

                      <li>
                        <Link
                          to="/dashboard/services"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option2' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Servicios
                        </Link>
                      </li>

                      <li>
                        <Link
                          to="/dashboard/projects"
                          className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/option2' ? 'bg-red-600 bg-gray-800 text-red-600 font-semibold' : ''
                            }`}
                        >
                          Proyectos
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              )
            }

            {/* Settings link with active indicator */}
            <li>
              <Link
                to="/dashboard/settings"
                className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 flex gap-2 ${location.pathname === '/dashboard/settings' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                  }`}
              >
                <span className='mt-1'>
                  <IoSettingsSharp />
                </span>
                Configuraciones
              </Link>
            </li>
          </ul>
        </nav>

        <div className='px-4 py-6 mb-5'>
          <button className='flex gap-2 text-red-400 hover:text-red-300 transition-colors duration-200 ease-in-out'
            onClick={handleLogout}
          >
            <span className='mt-1'>
              <PiSignOutBold />
            </span>
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

