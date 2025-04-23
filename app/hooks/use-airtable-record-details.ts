"use client";

import { useState, useEffect } from "react";
import airtableService, { AirtableRecord } from "../services/AirtableService";

export function useAirtableRecordDetails(recordId: string) {
  const [record, setRecord] = useState<AirtableRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRecord() {
      if (!recordId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetchedRecord = await airtableService.getRecordById(recordId);
        
        if (fetchedRecord) {
          setRecord(fetchedRecord);
        } else {
          setRecord(null);
        }
      } catch (err) {
        console.error("Error fetching Airtable record:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch record"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecord();
  }, [recordId]);

  return { record, isLoading, error };
} 