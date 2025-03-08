import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="h-80 w-full max-w-4xl bg-white rounded-xl shadow-lg flex">

        {/* Left Side: Welcome Message with Red Background */}
        <div className="w-1/2 p-8 bg-red-700 text-white rounded-l-xl flex flex-col justify-center">
          <h2 className="text-4xl font-semibold mb-4">Bienvenido a SMR Heavy Maq</h2>
          <p className="text-lg mb-4">
            Expertos en Mantenimiento de Maquinaria Pesada
          </p>
          <p className="text-sm">
            Soluciones profesionales y servicio técnico especializado para mantener su maquinaria funcionando de manera óptima.
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <div className="space-y-6">
            <Outlet />
          </div>
        </div>

      </div>
    </div>
  );
}

export default AuthLayout;

