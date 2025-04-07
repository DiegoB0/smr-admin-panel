import { Outlet } from 'react-router-dom';
import loginImage from '../../assets/loginImage.jpeg'

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg flex">

        {/* Left Side: Welcome Message with Red Background */}
        <div className="w-1/2 p-8 text-white rounded-l-xl flex flex-col justify-center relative">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${loginImage})`,
              filter: 'blur(2px)',
            }}
          ></div>

          <div
            className="absolute inset-0 bg-black"
            style={{
              opacity: 0.6,
            }}
          ></div>

          <h2 className="text-4xl font-semibold mb-4 relative">Bienvenido a SMR Heavy Maq</h2>
          <p className="text-lg mb-4 relative">
            Expertos en Mantenimiento de Maquinaria Pesada
          </p>
          <p className="text-sm relative">
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

