export const itemsNavbar = [
  {
    name: "Inicio",
    link: "/",
    roles: ["ADMINISTRADOR", "INVENTARIOS", "AUXILIAR_INVENTARIOS", "CONSULTA"],
  },
  {
    name: "Activos",
    link: "/gestion_almacen",
    roles: ["ADMINISTRADOR", "INVENTARIOS", "AUXILIAR_INVENTARIOS"],
  },
  {
    name: "Usuarios",
    link: "/control_usuarios",
    roles: ["ADMINISTRADOR"],
  },
  {
    name: "Reportes",
    link: "/gestion_activos/reportes",
    roles: ["ADMINISTRADOR", "INVENTARIOS"],
  },
];