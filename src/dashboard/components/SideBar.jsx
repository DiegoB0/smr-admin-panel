import React, { useState } from 'react';
import { PiHandshake, PiStorefront, PiTractorFill, PiUsers } from "react-icons/pi";
import { IoIosFunnel } from "react-icons/io";
import { HiCube } from "react-icons/hi2";
import { FaHelmetSafety } from "react-icons/fa6";
import { FaFileAlt, FaStore } from "react-icons/fa";
import { IoStorefront } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/features/auth/authSlice';
import { FaPaperPlane } from "react-icons/fa6";
import { FaHome } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { IoIosNotifications } from "react-icons/io";
import { MdKeyboardArrowUp } from "react-icons/md";
import { PiSignOutBold } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import { useAuthFlags } from '../../hooks/useAuth';

function Sidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenWeb, setIsOpenWeb] = useState(false);
  const [isOpenAlmacen, setIsOpenAlmacen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();

  const { isAdmin, isAdminAlmacen, isAdminCompras, isAdminWeb, isOperador, isAdminConta, canReadUsers, canCreatePost } = useAuthFlags();

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
    dispatch(logout())
    navigate('/auth/login');
  };

  return (
    <div className="w-[300px] bg-gray-900 text-white h-screen flex flex-col overflow-y-auto">
      <div className='flex justify-center items-center'>
        <h1 className='text-2xl text-gray-200 font-extrabold'>Logmine Admin<span className='text-6xl text-red-600'>.</span></h1>
      </div>
      <div className='flex flex-col justify-around h-full'>
        <nav className="flex-1 px-4 py-6">
          <ul>

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
              canReadUsers && (
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
              isAdminCompras && (
                <>
                  <li>
                    <Link
                      to="/dashboard/requisiciones/compras"
                      className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === "/dashboard/requisiciones/compras"
                        ? "border-l-2 text-red-400 font-semibold bg-gray-800"
                        : ""
                        }`}
                    >
                      <span className="mt-1">
                        <PiHandshake />
                      </span>
                      Compras
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/dashboard/entradas/compras"
                      className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === "/dashboard/entradas/compras"
                        ? "border-l-2 text-red-400 font-semibold bg-gray-800"
                        : ""
                        }`}
                    >
                      <span className="mt-1">
                        <FaFileAlt />
                      </span>
                      Entradas
                    </Link>
                  </li>
                </>
              )
            }

            {
  isAdminConta && (
    <li>
      <Link
        to="/dashboard/requisiciones"
        className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === "/dashboard/requisiciones/conta"
          ? "border-l-2 text-red-400 font-semibold bg-gray-800"
          : ""
          }`}
      >
        <span className="mt-1">
          <FaPaperPlane />
        </span>
        Requisiciones
      </Link>
    </li>
  )
}

            {
              isAdmin && (
                <>
                  <li>
                    <Link
                      to="/dashboard/obras"
                      className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === '/dashboard/obras' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                        }`}
                    >
                      <span className='mt-1'>
                        <FaHelmetSafety />
                      </span>
                      Obras
                    </Link>
                  </li>


                  <li>
                    <Link
                      to="/dashboard/productos"
                      className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === '/dashboard/productos' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                        }`}
                    >
                      <span className='mt-1'>
                        <HiCube />
                      </span>
                      Productos
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/dashboard/equipos"
                      className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === '/dashboard/equipos' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                        }`}
                    >
                      <span className='mt-1'>
                        <PiTractorFill />
                      </span>
                      Equipos
                    </Link>
                  </li>


                  <li>
                    <Link
                      to="/dashboard/proveedores"
                      className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === '/dashboard/proveedores' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                        }`}
                    >
                      <span className='mt-1'>
                        <FaStore />
                      </span>
                      Proveedores
                    </Link>
                  </li>
                </>
              )
            }


            {
              (isAdminAlmacen || isAdmin) && (
                <>

                  <li>
                    <Link
                      to="/dashboard/filtros"
                      className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 flex gap-2 hover:bg-gray-800 ${location.pathname === '/dashboard/filtros' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                        }`}
                    >
                      <span className='mt-1'>
                        <IoIosFunnel />
                      </span>
                      Filtros
                    </Link>
                  </li>
                  <li>
                    <button
                      className={`block w-full py-2 px-4 text-left rounded-md mb-2 hover:border-l-2 border-red-600 ${isOpenAlmacen ? 'border-l-2' : ''}`}
                      onClick={toggleDropdownAlmacen}
                    >
                      <div className='flex gap-2'>
                        <span className='mt-1'>
                          <IoStorefront />
                        </span>
                        <div className='flex gap-2 justify-between w-full'>
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
                            to="/dashboard/almacenes"
                            className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/almacenes' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                              }`}
                          >
                            Almacenes
                          </Link>
                        </li>

                        {/* { */}
                        {/*   isAdminAlmacen && ( */}
                        {/*     <li> */}
                        {/*       <Link */}
                        {/*         to="/dashboard/reportes" */}
                        {/*         className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/reportes' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : '' */}
                        {/*           }`} */}
                        {/*       > */}
                        {/*         Reportes */}
                        {/*       </Link> */}
                        {/*     </li> */}
                        {/*   ) */}
                        {/* } */}

                        <li>
                          <Link
                            to="/dashboard/requisiciones"
                            className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 ${location.pathname === '/dashboard/requisiciones' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                              }`}
                          >
                            Requisiciones
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                </>
              )
            }

            {
              isOperador && (
                <li>
                  <Link
                    to="/dashboard/reportes/operadores"
                    className={`block py-2 px-4 rounded-md mb-2 hover:border-l-2 border-red-600 hover:bg-gray-800 flex gap-2 ${location.pathname === '/dashboard/reportes/operadores' ? 'border-l-2 text-red-400 font-semibold bg-gray-800' : ''
                      }`}
                  >
                    <span className='mt-1'>
                      <FaFileAlt />
                    </span>
                    Reportes
                  </Link>
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

