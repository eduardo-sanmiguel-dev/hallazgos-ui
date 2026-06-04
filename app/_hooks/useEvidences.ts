import { useState } from "react";

import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

import { FiltersEvidences } from "@routes/hallazgos/_components/FiltersEvidence";

const query = gql`
  query Evidences(
    $page: Int!
    $limit: Int!
    $id: Int
    $ids: [Int!]
    $manufacturingPlantId: Float
    $mainTypeIds: [Int!]
    $secondaryTypeIds: [Int!]
    $areaIds: [Int!]
    $zoneIds: [Int!]
    $responsibleIds: [Int!]
    $statuses: [String!]
    $startDate: String
    $endDate: String
  ) {
    evidences(
      page: $page
      limit: $limit
      id: $id
      ids: $ids
      manufacturingPlantId: $manufacturingPlantId
      mainTypeIds: $mainTypeIds
      secondaryTypeIds: $secondaryTypeIds
      areaIds: $areaIds
      zoneIds: $zoneIds
      responsibleIds: $responsibleIds
      statuses: $statuses
      startDate: $startDate
      endDate: $endDate
    ) {
      count
      data {
        id
        status
        priorityDays
        createdAt
        updatedAt
        solutionDate
        startProcessDate
        imgEvidence
        imgProcess
        imgSolution
        description
        descriptionSolution
        manufacturingPlant {
          id
          name
        }
        user {
          name
        }
        mainType {
          name
        }
        secondaryType {
          name
        }
        supervisors {
          id
          name
        }
        responsibles {
          id
          name
        }
        zone {
          name
          area {
            name
          }
        }
        process {
          name
        }
        comments {
          id
          comment
          user {
            name
          }
          createdAt
        }
        user {
          name
        }
      }
    }
  }
`;

interface ResponseEvidences {
  evidences: Evidences;
}

interface Evidences {
  count: number;
  data: EvidenceGraphql[];
}

export interface CommentEvidenceGraphql {
  id: number;
  comment: string;
  user: { name: string };
  createdAt: Date;
}

export interface EvidenceGraphql {
  id: number;
  status: string;
  priorityDays?: number | null;
  createdAt: Date;
  updatedAt: Date;
  solutionDate: Date | null;
  startProcessDate: Date | null;
  imgEvidence: string;
  imgProcess: string;
  imgSolution: string;
  manufacturingPlant: IdAndName;
  user: OnlyName;
  mainType: OnlyName;
  secondaryType: OnlyName;
  supervisors: { id: number; name: string }[];
  responsibles: { id: number; name: string }[];
  comments: CommentEvidenceGraphql[];
  zone: {
    name: string;
    area?: OnlyName | null;
  };
  process: OnlyName | null;
  description?: string;
  descriptionSolution?: string;
}

interface OnlyName {
  name: string;
}

interface IdAndName {
  id: number;
  name: string;
}

export const useEvidences = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const getPageAndLimit = () => ({ page: page + 1, limit: rowsPerPage });

  const [findEvidences, { called, loading, data }] =
    useLazyQuery<ResponseEvidences>(query, { fetchPolicy: "no-cache" });

  const handleFindEvidences = (filters: FiltersEvidences) => {
    const evidenceIds = filters.evidenceId
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);

    const variables = {
      ...(evidenceIds.length === 1 && {
        id: evidenceIds[0],
      }),
      ...(evidenceIds.length > 1 && {
        ids: evidenceIds,
      }),
      ...(filters.manufacturingPlantId && {
        manufacturingPlantId: Number(filters.manufacturingPlantId),
      }),
      ...(filters.mainTypeIds.length > 0 && {
        mainTypeIds: filters.mainTypeIds.map((id) => Number(id)),
      }),
      ...(filters.secondaryTypeIds.length > 0 && {
        secondaryTypeIds: filters.secondaryTypeIds.map((id) => Number(id)),
      }),
      ...(filters.areaIds.length > 0 && {
        areaIds: filters.areaIds.map((id) => Number(id)),
      }),
      ...(filters.zoneIds.length > 0 && {
        zoneIds: filters.zoneIds.map((id) => Number(id)),
      }),
      ...(filters.responsibleIds.length > 0 && {
        responsibleIds: filters.responsibleIds.map((id) => Number(id)),
      }),
      ...(filters.states.length > 0 && {
        statuses: filters.states,
      }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    };

    return findEvidences({
      variables: { ...getPageAndLimit(), ...variables },
    });
  };

  return {
    findEvidences: handleFindEvidences,
    isCalled: called,
    isLoading: loading,
    evidences: (data?.evidences.data || []) as EvidenceGraphql[],
    countEvidence: data?.evidences.count || 0,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  };
};
