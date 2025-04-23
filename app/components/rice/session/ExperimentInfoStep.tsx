"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowRight, User, Building, FileSpreadsheet, TrendingUp, ExternalLink, Hash, ChevronDown, ChevronUp } from "lucide-react";
import { useAirtableRecordDetails } from "@/app/hooks/use-airtable-record-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "../../../../components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ExperimentInfoStepProps {
  sessionId: string;
  onContinue: () => void;
}

export default function ExperimentInfoStep({ sessionId, onContinue }: ExperimentInfoStepProps) {
  const [airtableRecordId, setAirtableRecordId] = useState<string | null>(null);
  const [expandedContext, setExpandedContext] = useState(false);
  
  // Récupérer l'ID Airtable depuis le localStorage
  useEffect(() => {
    const recordId = localStorage.getItem(`rice_session_${sessionId}_airtable_record_id`);
    setAirtableRecordId(recordId);
  }, [sessionId]);
  
  // Récupérer les détails si un ID Airtable est disponible
  const { record, isLoading, error } = useAirtableRecordDetails(airtableRecordId || '');
  
  // Si aucun ID Airtable n'est trouvé, on passe à l'étape suivante
  if (!airtableRecordId) {
    return null;
  }
  
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
      window.open(record.recordLink, '_blank');
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
    <Card className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-background to-muted/50">
      <div className="space-y-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Experiment Information
          </h1>
          <p className="text-muted-foreground mt-1">
            Review details of the experiment before starting the RICE prioritization
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load experiment details. You can continue with the session anyway.
            </AlertDescription>
          </Alert>
        ) : record ? (
          <div className="space-y-6">
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
              
              <div className="flex items-center gap-3">
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
                
                <Button 
                  onClick={onContinue} 
                  size="sm"
                  className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <span>Continue to Prioritization</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No experiment details available
          </div>
        )}
      </div>
    </Card>
  );
} 