import { api } from '../api/api';

export function useFiltros() {

  const listCategoriaFiltros = ({
    page = 1,
    limit = 10,
    search = '',
    order = 'ASC'
  }) => {
    const params = { page, limit, search, order }

    return api.get('filtros/categorias', { params });
  };

  const getFiltrosByHrs = ({ no_economico, hrs }) => {
    return api.get(`filtros/${encodeURIComponent(no_economico)}/hrs/${hrs}`);
  };


  return {
    listCategoriaFiltros,
    getFiltrosByHrs
  };
}
