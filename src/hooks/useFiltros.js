import { api } from '../api/api';

export function useFiltros() {

  const listCategoriaFiltros = ({
    page = 1,
    limit = 10,
    search = '',
    order = 'ASC'
  }) => {
    const params = { page, limit, search, order };
    return api.get('filtros/categorias', { params });
  };

  const getFiltrosByHrs = ({
    no_economico,
    hrs
  }) => {
    return api.get(`filtros/${no_economico}/hrs/${hrs}`)
  }

  const createCategoria = (nombre) => {
    return api.post('filtros/categorias', { nombre });
  };

  const updateCategoria = (categoriaId, nombre) => {
    return api.patch(`filtros/categorias/${categoriaId}`, { nombre });
  };

  const deleteCategoria = (categoriaId) => {
    return api.delete(`filtros/categorias/${categoriaId}`);
  };

  const getFiltrosByCategoria = (categoriaId, hrs) => {
    return api.get(`filtros/categorias/${categoriaId}/items/${hrs}`);
  };

  const addFiltros = (categoriaId, hrs, items) => {
    return api.post(`filtros/categorias/${categoriaId}/items/${hrs}`, { items });
  };

  const updateFiltro = (itemId, data) => {
    return api.patch(`filtros/items/${itemId}`, data);
  };

  const deleteFiltro = (itemId) => {
    return api.delete(`filtros/items/${itemId}`);
  };

  return {
    listCategoriaFiltros,
    createCategoria,
    updateCategoria,
    getFiltrosByCategoria,
    getFiltrosByHrs,
    deleteCategoria,
    addFiltros,
    updateFiltro,
    deleteFiltro
  };
}
