import React, { useState } from 'react';


function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 space-y-12">
      <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase">Configuraciones</h2>
      <hr className='text-gray-300' />

      <form className="space-y-6 bg-white p-6 rounded-lg shadow-md">

        <div >
          <h2 className="text-xl font-semibold mb-4 text-gray-600">Mi perfil</h2>
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full mt-1 p-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>


          {/* Email */}
          <div className="w-1/2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"

              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email"
              className="w-full mt-1 p-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex gap-4">
          <div className="w-1/2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}

              placeholder="Tu contraseña"
              className="w-full mt-1 p-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Profile Picture */}
        <div className="flex gap-4">
          <div className="w-1/2">
            <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">

              Imagen de Perfil
            </label>
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full mt-1 text-gray-700 file:bg-gray-200 file:border-0 file:rounded-xl file:px-4 file:py-2 file:text-gray-700 file:cursor-pointer"
            />

            {/* Image Preview */}
            {previewImage && (
              <div className="mt-4">
                <img
                  src={previewImage}

                  alt="Profile Preview"
                  className="max-h-40 w-auto rounded-xl border border-gray-300"
                />
              </div>
            )}
          </div>
        </div>


        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;

