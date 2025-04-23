"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Loader2, AlertCircle, User, Building, FileSpreadsheet, TrendingUp, ExternalLink, Hash, ChevronDown, ChevronUp, FlaskConical, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import airtableService from "@/app/services/AirtableService";

interface ExperimentInfoModalProps {
  sessionId: string;
}

export default function ExperimentInfoModal({ sessionId }: ExperimentInfoModalProps) {
  const [airtableRecordId, setAirtableRecordId] = useState<string | null>(null);
  const [expandedContext, setExpandedContext] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [record, setRecord] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fonction pour récupérer les données
  const fetchRecord = useCallback(async () => {
    if (!airtableRecordId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedRecord = await airtableService.getRecordById(airtableRecordId);
      setRecord(fetchedRecord);
    } catch (err) {
      console.error("Error fetching record details:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch experiment details"));
    } finally {
      setIsLoading(false);
    }
  }, [airtableRecordId]);

  // Récupérer l'ID Airtable depuis le localStorage uniquement quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      const recordId = localStorage.getItem(`rice_session_${sessionId}_airtable_record_id`);
      setAirtableRecordId(recordId);
    }
  }, [sessionId, isOpen]);

  // Déclencher le fetchRecord lorsque l'ID est disponible ou que retryCount change
  useEffect(() => {
    if (isOpen && airtableRecordId) {
      fetchRecord();
    }
  }, [isOpen, airtableRecordId, retryCount, fetchRecord]);

  // Fonction pour relancer le chargement
  const handleRetry = () => {
    console.log("Retrying to fetch record...");
    setRetryCount(prev => prev + 1);
  };

  const extractExperimentId = (name: string): string => {
    if (!name) return "";
    // Cherche un pattern comme "XX #123" en début de chaîne (ES, UK, AT, etc. suivi d'un numéro)
    const match = name.match(/^([A-Z]{2,})\s*#?(\d+)/i);
    if (match && match[1] && match[2]) {
      return `${match[1].toUpperCase()} #${match[2]}`;
    }
    return "";
  };

  const extractTitle = (name: string): string => {
    if (!name) return "";
    // Cherche la troisième partie après les séparateurs "|"
    const parts = name.split('|');
    if (parts.length >= 3) {
      return parts[2].trim();
    }

    // Si pas de 3ème partie mais qu'il y a une 2ème, retourne la 2ème partie
    if (parts.length === 2) {
      return parts[1].trim();
    }

    // Sinon supprime juste le préfixe (XX #123)
    return name.replace(/^[A-Z]{2,}\s*#?\d+\s*[|]\s*/i, '').trim();
  };

  const openAirtableRecord = () => {
    if (record?.recordLink) {
      window.open(record.recordLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Vérifier si le contexte est long (plus de 5 lignes)
  const isContextLong = !!record?.context && record.context.split('\n').length > 5;

  // Tronquer le contexte si nécessaire
  const displayContext = () => {
    if (!record?.context) return '';

    if (isContextLong && !expandedContext) {
      const lines = record.context.split('\n');
      return lines.slice(0, 5).join('\n') + '...';
    }

    return record.context;
  };

  const toggleContext = () => {
    setExpandedContext(!expandedContext);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-transparent"
          title="View experiment information"
        >
          <FlaskConical className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          Experiment Information
        </DialogTitle>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !record ? (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load experiment details.</span>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-2 text-xs flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
            <div className="bg-muted/20 p-4 rounded-lg border border-border/30">
              {extractExperimentId(record.name) && (
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono bg-blue-500/10">
                      {extractExperimentId(record.name)}
                    </Badge>
                    
                    {record.scope && (
                      <Badge variant="outline" className="text-xs font-medium border-orange-500/30 bg-orange-500/10 text-orange-600">
                        {record.scope}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {record.mainKpiName && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-purple-500/10">
                        <TrendingUp className="h-3 w-3" />
                        <span>{record.mainKpiName}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <h2 className="text-xl font-semibold text-primary/90 mb-3">{extractTitle(record.name)}</h2>
              
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {record.ownerName && (
                    <Badge variant="default" className="flex items-center gap-1 bg-gradient-to-r from-blue-600/90 to-blue-500/90">
                      <User className="h-3 w-3" />
                      <span>{record.ownerName}</span>
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {record.marketName && (
                    <Badge variant="outline" className="flex items-center gap-1 border-pink-500/30 bg-pink-500/10 text-pink-600">
                      <Building className="h-3 w-3" />
                      <span>{record.marketName}</span>
                    </Badge>
                  )}
                  
                  {record.pageName && (
                    <Badge variant="outline" className="flex items-center gap-1 border-purple-500/30 bg-purple-500/10 text-purple-600">
                      <FileSpreadsheet className="h-3 w-3" />
                      <span>{record.pageName}</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {record.hypothesis && (
                <div className="p-4 rounded-md bg-blue-500/5 border border-blue-500/20">
                  <h3 className="text-sm font-medium uppercase text-blue-600/90 mb-2">Hypothesis</h3>
                  <p className="text-sm">{record.hypothesis}</p>
                </div>
              )}
              
              {record.description && (
                <div className="p-4 rounded-md bg-purple-500/5 border border-purple-500/20">
                  <h3 className="text-sm font-medium uppercase text-purple-600/90 mb-2">Description</h3>
                  <p className="text-sm">{record.description}</p>
                </div>
              )}
              
              {record.context && (
                <div className="p-4 rounded-md bg-pink-500/5 border border-pink-500/20">
                  <h3 className="text-sm font-medium uppercase text-pink-600/90 mb-2">Context</h3>
                  <p className="text-sm whitespace-pre-line">{displayContext()}</p>
                  
                  {isContextLong && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleContext} 
                      className="mt-2 text-xs flex items-center gap-1 text-pink-600"
                    >
                      {expandedContext ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          <span>Show less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          <span>See more</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center text-xs text-muted-foreground">
                <Hash className="h-3 w-3 mr-1" />
                <span className="font-mono">{record.id}</span>
              </div>
              
              {record.recordLink && (
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={openAirtableRecord}
                  className="flex items-center gap-1 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View in Airtable</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 