import { api } from '../api/api';

export function useRequisiciones() {

  /* REPORTES */
  const createReporte = (data) => api.post('requisiciones/reportes/add', data);

  const listReportes = ({
    page = 1,
    limit = 10,
    search = '',
    order = 'ASC'
  }) => {
    const params = { page, limit, search, order };
    return api.get('requisiciones/reportes/all_reports', { params });
  };

  const listMyReportes = ({
    page = 1,
    limit = 10,
    search = '',
    order = 'ASC',
    userId
  }) => {
    const params = { page, limit, search, order };
    return api.get('requisiciones/reportes/reports_by_user', { params });
  };

  const updateReporte = (id, data) => api.patch(`requisiciones/reportes/update_report/${id}`, data);

  const approveReport = (id) => api.patch(`requisiciones/reportes/${id}/approve`)

  const rejectReporte = (id) => api.patch(`requisiciones/reportes/${id}/reject`)


  /* REQUISICIONES */

  return {
    createReporte,
    listReportes,
    listMyReportes,
    updateReporte,
    aproveReporte: approveReport,
    rejectReporte
  };
}
