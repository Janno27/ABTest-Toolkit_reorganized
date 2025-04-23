"use client";

import { useState, useEffect } from "react";
import airtableService, { AirtableRecord } from "../services/AirtableService";

type UseAirtableRecordsReturn = {
  records: AirtableRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook personnalisé pour récupérer des enregistrements depuis Airtable
 */
export function useAirtableRecords(): UseAirtableRecordsReturn {
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await airtableService.getRecordsFromExperimentations();
      setRecords(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des enregistrements:", err);
      setError(err instanceof Error ? err : new Error("Une erreur est survenue"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return { records, isLoading, error, refetch: fetchRecords };
} 