import React, { useEffect, useState } from 'react';
import { FaCirclePlus } from 'react-icons/fa6';
import Swal from 'sweetalert2';
import { useDebounce } from '../../hooks/customHooks';
import { useProductos } from '../../hooks/useProductos';
import { useAuthFlags } from '../../hooks/useAuth';

function ProductosPage() {
  const { listProductos, createProducto, deleteProducto, updateProducto } = useProductos();
  const { canCreateUsers, canDeleteUsers, canEditUsers } = useAuthFlags();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState('5');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false });

  // Form fields
  const [productoId, setProductoId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unidad, setUnidad] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const limit = limitOption === 'all' ? pagination.totalItems || 0 : parseInt(limitOption);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const clearForm = () => {
    setProductoId('');
    setName('');
    setDescription('');
    setUnidad('');
    setImageUrl('');
    setPreviewImage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    toggleModal();
    clearForm();
  };

  const fetchProductos = () => {
    setLoading(true);
    listProductos({ page, limit, search: debouncedSearch, order: 'ASC' })
      .then(res => {
        setProductos(res.data.data);
        setPagination(res.data.meta);
      })
      .catch(err => {
        Swal.fire('Error', err.message || 'Error al cargar productos', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProductos();
  }, [page, limit, debouncedSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: productoId,
      name,
      description,
      unidad,
      imageUrl: previewImage || imageUrl
    };

     const updatePayload = {
      name,
      description,
      unidad,
      imageUrl: previewImage || imageUrl
    };


    try {
      if (isEditing) {
        await updateProducto(editId, updatePayload);
        Swal.fire('Actualizado', 'Producto actualizado con éxito', 'success');
      } else {
        await createProducto(payload);
        Swal.fire('Registrado', 'Producto agregado con éxito', 'success');
      }
      fetchProductos();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.message || 'Ocurrió un error', 'error');
    }
  };

  const handleEdit = (producto) => {
    setIsEditing(true);
    setEditId(producto.id);
    setProductoId(producto.id);
    setName(producto.name);
    setDescription(producto.description);
    setUnidad(producto.unidad);
    setImageUrl(producto.imagenUrl);
    setPreviewImage(producto.imageUrl);
    toggleModal();
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás segura?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteProducto(id);
      Swal.fire('Eliminado', 'Producto eliminado con éxito', 'success');
      fetchProductos();
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo eliminar', 'error');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setLoading(true);
  };

  return (
    <div className="p-8 space-y-12 overflow-y-auto">
      <div className="mb-2 flex justify-between w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase">Productos</h2>
        {canCreateUsers && (
          <button onClick={toggleModal} className="flex gap-2 py-2 px-3 bg-gray-900 text-white rounded-xl font-semibold">
            Nuevo <span className="mt-1"><FaCirclePlus /></span>
          </button>
        )}
      </div>

      <div className="border border-gray-300 p-2 rounded-xl">
        <div className="flex gap-4 items-center justify-end">
          <select value={limitOption} onChange={e => setLimitOption(e.target.value)} className="px-2 py-1 border rounded">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="all">TODOS</option>
          </select>
          <input
            type="text"
            placeholder="Buscar productos…"
            value={searchTerm}
            onChange={handleSearchChange}
            className="px-3 py-1 text-lg border text-gray-800 rounded-md bg-gray-200 border-transparent"
          />
        </div>

        <table className="min-w-full bg-white text-sm mt-4">
          <thead className="bg-gray-200 text-center text-base uppercase font-semibold">
            <tr>
              <th className="px-4 py-2 text-gray-600">ID</th>
              <th className="px-4 py-2 text-gray-600">Nombre</th>
              <th className="px-4 py-2 text-gray-600">Descripción</th>
              <th className="px-4 py-2 text-gray-600">Unidad</th>
              <th className="px-4 py-2 text-gray-600">Imagen</th>
              <th className="px-4 py-2 text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">Cargando...</td></tr>
            ) : productos.length > 0 ? (
              productos.map(p => (
                <tr key={p.id} className="text-center">
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td>{p.unidad}</td>
                  <td><img src={p.imageUrl} alt="Producto" className="h-12 mx-auto rounded" /></td>
                  <td className="flex justify-end gap-2 p-2">
                    {canEditUsers && (
                      <button onClick={() => handleEdit(p)} className="bg-blue-600 text-white rounded px-4 py-1">Editar</button>
                    )}
                    {canDeleteUsers && (
                      <button onClick={() => handleDelete(p.id)} className="bg-red-600 text-white rounded px-4 py-1">Eliminar</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500 italic">No se encontraron productos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
          <div className="bg-white text-black rounded-xl p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit}>
              {!isEditing && (
                <div className="mb-4">
                  <label>ID (Refacción)</label>
                  <input value={productoId} onChange={e => setProductoId(e.target.value)} required className="input" />
                </div>
              )}
              <div className="mb-4">
                <label>Nombre</label>
                <input value={name} onChange={e => setName(e.target.value)} required className="input" />
              </div>
              <div className="mb-4">
                <label>Descripción</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="input" />
              </div>
              <div className="mb-4">
                <label>Unidad</label>
                <input value={unidad} onChange={e => setUnidad(e.target.value)} className="input" />
              </div>
              <div className="mb-4">
                <label>Imagen</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="input" />
                {previewImage && <img src={previewImage} alt="Preview" className="h-24 mt-2 rounded" />}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={handleCloseModal} className="text-red-500">Cancelar</button>
                <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded">Guardar</button>
              </div>
            </form>
            <button onClick={handleCloseModal} className="absolute top-2 right-4 text-2xl text-gray-600">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductosPage;
