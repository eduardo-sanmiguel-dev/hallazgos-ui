export interface ResponseOpenVsClosed {
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
}

export interface ResponseAccidents {
  numeroDeMes: number;
  numeroDeEmpleados: number;
  numeroDeAccidentes: number;
  nombreMes: string;
}

export interface ResponseDashboardMultiNivel {
  statusData: StatusDatum[];
  statusSeries: StatusSery[];
}

export interface ResponseDashboardStatusByFilters {
  total: number;
  startDate: string;
  endDate: string;
  seriesData: {
    name: string;
    y: number;
  }[];
}

export interface ResponseDashboardPriorityInterventionByFilters {
  total: number;
  totalWithPriority: number;
  totalWithoutPriority: number;
  startDate: string;
  endDate: string;
  seriesData: {
    name: string;
    days: number;
    y: number;
    color: string;
  }[];
}

export interface ResponseDashboardRiskLevelByFilters {
  total: number;
  totalWithPriority: number;
  totalWithoutPriority: number;
  startDate: string;
  endDate: string;
  seriesData: {
    name: string;
    y: number;
    color: string;
  }[];
}

export interface ResponseDashboardAssignedResponsiblesByFilters {
  total: number;
  startDate: string;
  endDate: string;
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
}

export interface ResponseDashboardHistoricalByMonth {
  startMonth: string;
  endMonth: string;
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
}

export interface ResponseDashboardSankeyByFilters {
  total: number;
  startDate: string;
  endDate: string;
  nodes: {
    id: string;
    name: string;
    column: number;
  }[];
  links: {
    from: string;
    to: string;
    weight: number;
  }[];
}

export interface ResponseDashboardPackedBubbleByFilters {
  total: number;
  startDate: string;
  endDate: string;
  series: {
    name: string;
    data: {
      name: string;
      value: number;
    }[];
  }[];
}

export interface ResponseDashboardSolidGaugeKpiByFilters {
  total: number;
  startDate: string;
  endDate: string;
  closurePercentage: number;
  avgResolutionDays: number;
  backlogActive: number;
}

export interface ResponseDashboardAreaRangeLineByFilters {
  startDate: string;
  endDate: string;
  categories: string[];
  actualSeries: Array<number | null>;
  forecastSeries: Array<number | null>;
  rangeSeries: Array<[number, number] | null>;
  forecastHorizonMonths: number;
}

export interface ResponseDashboardHeatmapByFilters {
  startDate: string;
  endDate: string;
  totalAreas: number;
  totalEvidences: number;
  totalOpenEvidences: number;
  totalOpenEvidencesWithCoordinates: number;
  maxX: number;
  maxY: number;
  maxValue: number;
  points: ResponseDashboardHeatmapPoint[];
}

export interface ResponseDashboardHeatmapPoint {
  areaId: number;
  areaName: string;
  x: number;
  y: number;
  zoomLevel: number | null;
  value: number;
  dominantStatus: string;
  statusCounts: {
    Abierto: number;
    "En progreso": number;
    Cerrado: number;
    Cancelado: number;
  };
}

interface StatusDatum {
  name: string;
  y: number;
  drilldown: string;
}

interface StatusSery {
  name: string;
  id: string;
  data: Array<Array<number | string>>;
}

export interface ResponseDashboardMainTypes {
  series: ResponseDashboardMainTypesSeries[];
  drilldown: Drilldown;
}

interface Drilldown {
  breadcrumbs: Breadcrumbs;
  series: DrilldownSeries[];
}

interface Breadcrumbs {
  position: Position;
}

interface Position {
  align: string;
}

interface DrilldownSeries {
  name: string;
  id: string;
  data: Array<Array<number | string>>;
}

interface ResponseDashboardMainTypesSeries {
  name: string;
  colorByPoint: boolean;
  data: DatumClass[];
}

interface DatumClass {
  name: string;
  y: number;
  drilldown: null | string;
}

export interface ResponseDashboardEvidencesByMonth {
  series: ResponseDashboardEvidencesByMonthSeries[];
  categories: string[];
}

interface ResponseDashboardEvidencesByMonthSeries {
  name: string;
  data: number[];
}

export interface ResponseTopUsersByPlant {
  data: TopUsersByPlantData[];
}

export interface TopUsersByPlantData {
  name: string;
  data: TopUsersByPlant[];
}

interface TopUsersByPlant {
  userId: number;
  username: string;
  manufacturingPlantId: number;
  manufacturingplantname: string;
  total: string;
}

export interface MonthlySubtypeTrend {
  planta: string;
  tipo_principal: string;
  tipo_secundario: string;
  total_historico: string;
  total_mes_actual: string;
  total_mes_anterior: string;
  pct_cambio: string;
}

/** Rango de fechas inclusivo, 'YYYY-MM-DD'. */
export interface BiEppDateRange {
  desde: string;
  hasta: string;
}

/** Equipo con entregas fuera de rango en el periodo. */
export interface BiEppOutOfRangeEquipment {
  equipmentId: number;
  equipmentName: string;
  deliveries: number;
  outOfRange: number;
  // Colaboradores distintos con entregas fuera de rango de este equipo.
  employees: number;
  // Días promedio antes de tiempo; null sin entrega anterior registrada.
  averageDaysEarly: number | null;
}

/** Colaborador × equipo (de quienes tuvieron alguna entrega fuera de rango). */
export interface BiEppOutOfRangeRow {
  employeeId: number;
  name: string;
  code: string | null;
  area: string | null;
  position: string | null;
  equipmentId: number;
  equipmentName: string;
  deliveries: number;
  outOfRange: number;
  averageDaysEarly: number | null;
  lastDelivery: string;
}

export interface BiEppOutOfRange {
  periodo: BiEppDateRange;
  byEquipment: BiEppOutOfRangeEquipment[];
  byEmployeeEquipment: BiEppOutOfRangeRow[];
}

export interface BiEppEmployeeDelivery {
  id: number;
  date: string;
  equipmentName: string;
  quantity: number;
  frequencyDays: number | null;
  previousDelivery: string | null;
  outOfRange: boolean;
  daysEarly: number | null;
  registeredBy: string | null;
}

export interface BiEppEmployeeDetail {
  periodo: BiEppDateRange;
  employee: {
    id: number;
    name: string;
    code: string | null;
    area: string | null;
    position: string | null;
  };
  deliveries: BiEppEmployeeDelivery[];
}

/** Valores de un periodo "a la fecha" (ver kpis.periodo). */
export interface BiEppPeriodValues {
  gasto: number;
  unidades: number;
  entregas: number;
  fueraDeRango: number;
  empleados: number;
  primeraVez: number;
}

export interface BusinessIntelligenceEpp {
  // Si algún equipo de la planta tiene precio (sin precios se oculta el gasto).
  hasPrices: boolean;
  kpis: {
    // Fechas YYYY-MM-DD: mes en curso hasta hoy y mismos días del anterior.
    // Periodo elegido y su periodo de comparación.
    periodo: { actual: BiEppDateRange; anterior: BiEppDateRange };
    actual: BiEppPeriodValues;
    anterior: BiEppPeriodValues;
    promedioGlobal: number;
  };
  chart1: Chart1[];
  chart3: Chart3[];
  chart4: Chart4[];
  chart8: Chart[];
  chart9: Chart9[];
}

interface Chart1 {
  equipment_name: string;
  gasto_mes_actual: string;
  unidades_mes_actual: string;
  gasto_mes_anterior: string;
  unidades_mes_anterior: string;
}

interface Chart {
  mes_label: string;
  mes_date: Date;
  empleados_con_entrega: string;
  gasto_total: string;
  gasto_promedio_por_empleado: string;
  unidades_total: string;
}

interface Chart3 {
  mes_label: string;
  mes: Date;
  total_entregas: string;
  fuera_de_rango: string;
  en_rango: string;
  pct_fuera_de_rango: string;
}

interface Chart4 {
  equipment_name: string;
  unidades_mes_actual: string;
  unidades_mes_anterior: string;
  empleados_mes_actual: string;
  empleados_mes_anterior: string;
}

interface Chart9 {
  equipment_name: string;
  gasto_total: string;
  unidades_total: string;
  pct_del_total: string;
}
