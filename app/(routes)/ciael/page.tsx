"use client";

import { useEffect, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import DialogCreateCiael from "./components/DialogCreateCiael";
import TableCiaels from "./components/TableCiaels";
import { Ciael } from "@interfaces";
import { CiaelsService } from "@services";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";

const CiaelPage = () => {
  const [open, setOpen] = useState(false);
  const [ciaels, setCiaels] = useState<Ciael[]>([]);
  const [isLoadingExcel, setIsLoadingExcel] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getData = () => {
    setIsLoading(true);
    CiaelsService.findAll()
      .then(setCiaels)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <DialogCreateCiael open={open} setOpen={setOpen} getData={getData} />
      <PageHeader title="CIAEL">
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
        >
          Crear registro
        </Button>
        <Button
          variant="outlined"
          startIcon={<SimCardDownloadIcon />}
          onClick={() => {
            setIsLoadingExcel(true);
            CiaelsService.downloadExcel().finally(() =>
              setIsLoadingExcel(false),
            );
          }}
          loading={isLoadingExcel}
        >
          Excel
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      {isLoading ? <LoadingLinear /> : <TableCiaels data={ciaels} />}
    </>
  );
};

export default CiaelPage;
