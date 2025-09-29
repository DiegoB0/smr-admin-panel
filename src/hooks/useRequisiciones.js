import { api } from "../api/api";

export function useRequisiciones() {
  /* REPORTES */
  const createReporte = (data) => api.post("requisiciones/reportes/add", data);

  const createRequisicion = (data) =>
    api.post("requisiciones/create_requisicion", data);

  const listReportes = ({
    page = 1,
    limit = 10,
    search = "",
    order = "ASC",
  }) => {
    const params = { page, limit, search, order };
    return api.get("requisiciones/reportes/all_reports", { params });
  };

  const listMyReportes = ({
    page = 1,
    limit = 10,
    search = "",
    order = "ASC",
    userId,
  }) => {
    const params = { page, limit, search, order, userId };
    return api.get(`requisiciones/reportes/reports_by_user`, { params });
  };

  const listRequisiciones = ({
    page = 1,
    limit = 10,
    search = "",
    order = "ASC",
  }) => {
    const params = { page, limit, search, order };
    return api.get("requisiciones/all_requisiciones", { params });
  };

  // NUEVO: solo aprobadas (según tu imagen)
  const listAprovedRequisiciones = ({
    page = 1,
    limit = 10,
    search = "",
    order = "ASC",
  }) => {
    const params = { page, limit, search, order };
    return api.get("requisiciones/aproved_requisiciones", { params });
  };

  const updateReporte = (id, data) =>
    api.patch(`requisiciones/reportes/update_report/${id}`, data);
  const approveReporte = (id) =>
    api.patch(`requisiciones/reportes/${id}/approve`);

  const rejectReporte = (id) =>
    api.patch(`requisiciones/reportes/${id}/reject`);

  /* REQUISICIONES */
  const createServiceRequisicion = (data) =>
    api.post("requisiciones/create_service_requisicion", data);

  // NUEVO: endpoints para aprobar/rechazar requisiciones
  const approveRequisicion = (id) => api.patch(`requisiciones/${id}/approve`);
  const rejectRequisicion = (id) => api.patch(`requisiciones/${id}/reject`);

  return {
    createReporte,
    createRequisicion,
    listReportes,
    listMyReportes,
    updateReporte,
    approveReporte,
    rejectReporte,
    createServiceRequisicion,
    listRequisiciones,
    // nuevos
    approveRequisicion,
    rejectRequisicion,
    listAprovedRequisiciones, // <-- exportado
  };
}
