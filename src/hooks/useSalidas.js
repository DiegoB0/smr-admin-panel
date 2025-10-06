// hooks/useSalidas.js
import { api } from "../api/api";

export function useSalidas() {
  // GET /salidas/almacen/:almacenId?page&limit&search&order
  const listSalidas = ({
    almacenId,
    page = 1,
    limit = 10,
    search = "",
    order = "ASC",
  }) => {
    const params = { page, limit, search, order };
    return api.get(`salidas/almacen/${almacenId}`, { params });
  };

  // POST /salidas
  // Body:
  // {
  //   almacenOrigenId: number,
  //   recibidaPorId: string,
  //   autorizaId: string,
  //   equipoId: number,
  //   items: [{ productoId: string, cantidad: number }]
  // }
  const crearSalida = (data) => api.post("salidas", data);

  return {
    listSalidas,
    crearSalida,
  };
}