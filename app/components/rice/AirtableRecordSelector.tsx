"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AirtableRecord } from "../../services/AirtableService";
import { Loader2, AlertCircle } from "lucide-react";
import { useAirtableRecords } from "@/app/hooks/use-airtable-records";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AirtableRecordSelectorProps {
  onSelectRecord: (record: AirtableRecord) => void;
}

export default function AirtableRecordSelector({ onSelectRecord }: AirtableRecordSelectorProps) {
  const { records, isLoading, error } = useAirtableRecords();

  const handleSelectChange = (value: string) => {
    const selectedRecord = records.find(record => record.id === value);
    if (selectedRecord) {
      onSelectRecord(selectedRecord);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des tests Airtable
        </AlertDescription>
      </Alert>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Aucun test à prioriser trouvé dans Airtable
      </div>
    );
  }

  return (
    <Select onValueChange={handleSelectChange}>
      <SelectTrigger className="w-full border border-input rounded-md bg-background/60">
        <SelectValue placeholder="Sélectionner un test" />
      </SelectTrigger>
      <SelectContent>
        {records.map((record) => (
          <SelectItem key={record.id} value={record.id}>
            {record.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 