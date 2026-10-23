import axiosWrapper from "./axiosWrapper";
import {
  BiEppEmployeeDetail,
  BiEppOutOfRange,
  BusinessIntelligenceEpp,
  MonthlySubtypeTrend,
  User,
  ResponseAccidents,
  ResponseDashboardEvidencesByMonth,
  ResponseDashboardMainTypes,
  ResponseDashboardAssignedResponsiblesByFilters,
  ResponseDashboardHistoricalByMonth,
  ResponseDashboardPriorityInterventionByFilters,
  ResponseDashboardRiskLevelByFilters,
  ResponseDashboardPackedBubbleByFilters,
  ResponseDashboardAreaRangeLineByFilters,
  ResponseDashboardHeatmapByFilters,
  ResponseDashboardSankeyByFilters,
  ResponseDashboardSolidGaugeKpiByFilters,
  ResponseDashboardMultiNivel,
  ResponseDashboardStatusByFilters,
  ResponseOpenVsClosed,
  ResponseTopUsersByPlant,
} from "@interfaces";

const api = axiosWrapper({
  baseURL: "/dashboard",
});

const findAllStatus = async () => {
  const { data } = await api.get<ResponseDashboardMultiNivel>("/status");
  return data;
};

const findStatusByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<ResponseDashboardStatusByFilters>(
    "/status-by-filters",
    {
      params: {
        manufacturingPlantId,
        startDate,
        endDate,
        ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
        ...(responsibleIds &&
          responsibleIds.length > 0 && {
            responsibleIds: responsibleIds.join(","),
          }),
        ...(mainTypeIds &&
          mainTypeIds.length > 0 && {
            mainTypeIds: mainTypeIds.join(","),
          }),
      },
    },
  );
  return data;
};

const findPriorityInterventionByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } =
    await api.get<ResponseDashboardPriorityInterventionByFilters>(
      "/priority-intervention-by-filters",
      {
        params: {
          manufacturingPlantId,
          startDate,
          endDate,
          ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
          ...(responsibleIds &&
            responsibleIds.length > 0 && {
              responsibleIds: responsibleIds.join(","),
            }),
          ...(mainTypeIds &&
            mainTypeIds.length > 0 && {
              mainTypeIds: mainTypeIds.join(","),
            }),
        },
      },
    );
  return data;
};

const findRiskLevelByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<ResponseDashboardRiskLevelByFilters>(
    "/risk-level-by-filters",
    {
      params: {
        manufacturingPlantId,
        startDate,
        endDate,
        ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
        ...(responsibleIds &&
          responsibleIds.length > 0 && {
            responsibleIds: responsibleIds.join(","),
          }),
        ...(mainTypeIds &&
          mainTypeIds.length > 0 && {
            mainTypeIds: mainTypeIds.join(","),
          }),
      },
    },
  );
  return data;
};

const findAreasByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<ResponseDashboardStatusByFilters>(
    "/areas-by-filters",
    {
      params: {
        manufacturingPlantId,
        startDate,
        endDate,
        ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
        ...(responsibleIds &&
          responsibleIds.length > 0 && {
            responsibleIds: responsibleIds.join(","),
          }),
        ...(mainTypeIds &&
          mainTypeIds.length > 0 && {
            mainTypeIds: mainTypeIds.join(","),
          }),
      },
    },
  );
  return data;
};

const findMainTypesByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<ResponseDashboardStatusByFilters>(
    "/main-types-by-filters",
    {
      params: {
        manufacturingPlantId,
        startDate,
        endDate,
        ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
        ...(responsibleIds &&
          responsibleIds.length > 0 && {
            responsibleIds: responsibleIds.join(","),
          }),
        ...(mainTypeIds &&
          mainTypeIds.length > 0 && {
            mainTypeIds: mainTypeIds.join(","),
          }),
      },
    },
  );
  return data;
};

const findResponsiblesByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<User[]>("/responsibles-by-filters", {
    params: {
      manufacturingPlantId,
      startDate,
      endDate,
      areaIds: areaIds.join(","),
      ...(mainTypeIds &&
        mainTypeIds.length > 0 && {
          mainTypeIds: mainTypeIds.join(","),
        }),
    },
  });
  return data;
};

const findAssignedResponsiblesByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } =
    await api.get<ResponseDashboardAssignedResponsiblesByFilters>(
      "/assigned-responsibles-by-filters",
      {
        params: {
          manufacturingPlantId,
          startDate,
          endDate,
          ...(areaIds &&
            areaIds.length > 0 && {
              areaIds: areaIds.join(","),
            }),
          ...(responsibleIds &&
            responsibleIds.length > 0 && {
              responsibleIds: responsibleIds.join(","),
            }),
          ...(mainTypeIds &&
            mainTypeIds.length > 0 && {
              mainTypeIds: mainTypeIds.join(","),
            }),
        },
      },
    );
  return data;
};

const findHistoricalByMonth = async () => {
  const { data } = await api.get<ResponseDashboardHistoricalByMonth>(
    "/historical-by-month",
  );
  return data;
};

const findSankeyByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<ResponseDashboardSankeyByFilters>(
    "/sankey-by-filters",
    {
      params: {
        manufacturingPlantId,
        startDate,
        endDate,
        ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
        ...(responsibleIds &&
          responsibleIds.length > 0 && {
            responsibleIds: responsibleIds.join(","),
          }),
        ...(mainTypeIds &&
          mainTypeIds.length > 0 && {
            mainTypeIds: mainTypeIds.join(","),
          }),
      },
    },
  );
  return data;
};

const findPackedBubbleByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<ResponseDashboardPackedBubbleByFilters>(
    "/packed-bubble-by-filters",
    {
      params: {
        manufacturingPlantId,
        startDate,
        endDate,
        ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
        ...(responsibleIds &&
          responsibleIds.length > 0 && {
            responsibleIds: responsibleIds.join(","),
          }),
        ...(mainTypeIds &&
          mainTypeIds.length > 0 && {
            mainTypeIds: mainTypeIds.join(","),
          }),
      },
    },
  );
  return data;
};

const findSolidGaugeKpiByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<ResponseDashboardSolidGaugeKpiByFilters>(
    "/solid-gauge-kpi-by-filters",
    {
      params: {
        manufacturingPlantId,
        startDate,
        endDate,
        ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
        ...(responsibleIds &&
          responsibleIds.length > 0 && {
            responsibleIds: responsibleIds.join(","),
          }),
        ...(mainTypeIds &&
          mainTypeIds.length > 0 && {
            mainTypeIds: mainTypeIds.join(","),
          }),
      },
    },
  );
  return data;
};

const findAreaRangeLineByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<ResponseDashboardAreaRangeLineByFilters>(
    "/area-range-line-by-filters",
    {
      params: {
        manufacturingPlantId,
        startDate,
        endDate,
        ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
        ...(responsibleIds &&
          responsibleIds.length > 0 && {
            responsibleIds: responsibleIds.join(","),
          }),
        ...(mainTypeIds &&
          mainTypeIds.length > 0 && {
            mainTypeIds: mainTypeIds.join(","),
          }),
      },
    },
  );
  return data;
};

const findHeatmapByFilters = async ({
  manufacturingPlantId,
  startDate,
  endDate,
  areaIds,
  responsibleIds,
  mainTypeIds,
}: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  areaIds?: string[];
  responsibleIds?: string[];
  mainTypeIds?: string[];
}) => {
  const { data } = await api.get<ResponseDashboardHeatmapByFilters>(
    "/heatmap-by-filters",
    {
      params: {
        manufacturingPlantId,
        startDate,
        endDate,
        ...(areaIds && areaIds.length > 0 && { areaIds: areaIds.join(",") }),
        ...(responsibleIds &&
          responsibleIds.length > 0 && {
            responsibleIds: responsibleIds.join(","),
          }),
        ...(mainTypeIds &&
          mainTypeIds.length > 0 && {
            mainTypeIds: mainTypeIds.join(","),
          }),
      },
    },
  );
  return data;
};

const findOpendVsClosed = async () => {
  const { data } = await api.get<ResponseOpenVsClosed>("/open-vs-closed");
  return data;
};

const findAccidentRate = async (year?: number) => {
  const { data } = await api.get<ResponseAccidents[]>("/accidents-by-month", {
    params: {
      ...(year && { year }),
    },
  });
  return data;
};

const findAllZones = async () => {
  const { data } = await api.get<ResponseDashboardMultiNivel>("/zones");
  return data;
};

const findAllMainTypes = async () => {
  const { data } = await api.get<ResponseDashboardMainTypes>("/main-types");
  return data;
};

const findAllEvidencesByMonth = async (year?: number) => {
  const { data } = await api.get<ResponseDashboardEvidencesByMonth>(
    "/evidences-by-month",
    {
      params: {
        ...(year && { year }),
      },
    },
  );
  return data;
};

const findTopUsersByPlant = async () => {
  const { data } = await api.get<ResponseTopUsersByPlant>(
    "/top-users-by-plant",
  );
  return data.data;
};

const findMonthlySubtypeTrend = async ({
  manufacturingPlantId,
}: {
  manufacturingPlantId: string;
}) => {
  const { data } = await api.get<MonthlySubtypeTrend[]>(
    "/monthly-subtype-trend",
    {
      params: {
        manufacturingPlantId,
      },
    },
  );
  return data;
};

/** Planta y periodo (DD/MM/YYYY) del análisis de datos EPP. */
interface BiEppQuery {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
}

const findBusinessIntelligenceEpp = async (params: BiEppQuery) => {
  const { data } = await api.get<BusinessIntelligenceEpp>(
    `/business-intelligence/epp`,
    { params },
  );
  return data;
};

const findBusinessIntelligenceEppOutOfRange = async (params: BiEppQuery) => {
  const { data } = await api.get<BiEppOutOfRange>(
    `/business-intelligence/epp/out-of-range`,
    { params },
  );
  return data;
};

const findBusinessIntelligenceEppEmployee = async ({
  employeeId,
  ...params
}: BiEppQuery & { employeeId: number }) => {
  const { data } = await api.get<BiEppEmployeeDetail>(
    `/business-intelligence/epp/employees/${employeeId}`,
    { params },
  );
  return data;
};

export const DashboardService = {
  findHistoricalByMonth,
  findSankeyByFilters,
  findPackedBubbleByFilters,
  findSolidGaugeKpiByFilters,
  findAreaRangeLineByFilters,
  findHeatmapByFilters,
  findAssignedResponsiblesByFilters,
  findAreasByFilters,
  findMainTypesByFilters,
  findResponsiblesByFilters,
  findStatusByFilters,
  findPriorityInterventionByFilters,
  findRiskLevelByFilters,
  findBusinessIntelligenceEpp,
  findBusinessIntelligenceEppOutOfRange,
  findBusinessIntelligenceEppEmployee,
  findMonthlySubtypeTrend,
  findAccidentRate,
  findTopUsersByPlant,
  findAllEvidencesByMonth,
  findAllStatus,
  findAllZones,
  findAllMainTypes,
  findOpendVsClosed,
};
