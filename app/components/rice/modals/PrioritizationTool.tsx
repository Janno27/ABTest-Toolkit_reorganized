"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, ArrowRight, Trash2, Calendar, Loader2, Share2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { RiceSettingsModal } from "./RiceSettingsModal";
import { useRouter } from "next/navigation";
import RiceSessionSteps from "../session/RiceSessionSteps";
import { v4 as uuidv4 } from 'uuid';
import { RiceSession } from "../../../services/RiceSessionService";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase";
import { useToast } from "@/app/hooks/use-toast";
import supabaseRiceSessionService from "../../../services/db/SupabaseRiceSessionService";
import AirtableRecordSelector from "../AirtableRecordSelector";
import { AirtableRecord } from "@/app/services/AirtableService";
import { Separator } from "../../../../components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PrioritizationTool() {
  const router = useRouter();
  const { toast } = useToast();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [recentSessions, setRecentSessions] = useState<RiceSession[]>([]);
  const [activeSession, setActiveSession] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [copyTooltip, setCopyTooltip] = useState<string | null>(null);
  
  // Use the pre-created Supabase service instance
  const sessionService = supabaseRiceSessionService;

  useEffect(() => {
    // Load recent sessions
    const loadSessions = async () => {
      try {
        setIsLoadingSessions(true);
        const sessions = await sessionService.getAllSessions();
        // Sort by creation date (descending)
        const sortedSessions = sessions.sort((a: RiceSession, b: RiceSession) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setRecentSessions(sortedSessions);
      } catch (error) {
        console.error("Error loading sessions:", error);
        toast({
          title: "Error",
          description: "Unable to load RICE sessions",
          variant: "destructive"
        });
      } finally {
        setIsLoadingSessions(false);
      }
    };
    loadSessions();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Create a default settings ID
      const defaultSettingsId = '00000000-0000-0000-0000-000000000001';
      
      // Create a new session
      const newSession = await sessionService.createSession({
        name: sessionName,
        settingsId: defaultSettingsId,
        status: 'draft',
        participants: []
      });
      
      // Update local state
      setRecentSessions([newSession, ...recentSessions]);
      setSessionName("");
      
      // Show success toast
      toast({
        title: "Session created",
        description: "RICE session was created successfully"
      });
      
      // Start the new session immediately
      startSession(newSession.id, newSession.name);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Unable to create RICE session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAirtableRecordSelected = (record: AirtableRecord) => {
    // Mettre à jour le nom de session avec le nom du record Airtable
    setSessionName(record.name);
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await sessionService.deleteSession(id);
      setRecentSessions(recentSessions.filter(session => session.id !== id));
      toast({
        title: "Session deleted",
        description: "RICE session was deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Unable to delete RICE session",
        variant: "destructive"
      });
    }
  };
  
  const startSession = (id: string, name: string) => {
    // Store session ID for next steps
    localStorage.setItem(`rice_current_session_id`, id);
    localStorage.setItem(`rice_current_session_name`, name);
    
    setActiveSession({id, name});
  };

  // Fonction pour partager un lien vers la session
  const shareSessionLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le démarrage de la session lors du clic sur le bouton de partage
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/rice/${id}`;
    
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link copied",
      description: "The invitation link has been copied to your clipboard"
    });
    
    setCopyTooltip(id);
    setTimeout(() => setCopyTooltip(null), 2000);
  };

  // If a session is active, show its steps
  if (activeSession) {
    return <RiceSessionSteps sessionId={activeSession.id} />;
  }

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/(\d+) ([A-Za-z]+) (\d+)/, '$1 $2. $3');
  };

  return (
    <>
      <div 
        className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md"
        onMouseMove={handleMouseMove}
        style={{
          backgroundImage: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.15), transparent 80%)`
        }}
      >
        <div 
          className="absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(1200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(134, 213, 255, 0.25), rgba(228, 138, 255, 0.18), transparent 50%)`,
            transition: 'background 0.3s ease',
            transform: 'translateZ(0)',
          }}
        />
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-[#86d5ff30] via-[#8091ff25] to-[#e48aff30]"
            style={{
              transform: `translate(${mousePosition.x/20}px, ${mousePosition.y/20}px)`,
              filter: 'blur(40px)',
              transition: 'transform 0.4s ease',
              borderRadius: 'inherit',
            }}
          />
        </div>
        <Card className="relative p-6 backdrop-blur-sm bg-background/80 rounded-xl border-0 z-10">
          <div className="grid gap-6">
            <div className="text-center">
              <h3 className="text-xl font-medium mb-1">Prioritization Tool</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage collaborative prioritization sessions for your teams
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSettingsModal(true)}
                className="h-8 w-8 rounded-full"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <div className="mb-6">
                <Label htmlFor="session-name" className="block text-sm font-medium mb-2">Session name</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="session-name"
                    placeholder="e.g. Homepage redesign"
                    className="border border-input rounded-md bg-background/60"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                  <Button 
                    onClick={handleCreateSession} 
                    disabled={!sessionName.trim() || isLoading} 
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>Create session</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground font-medium">OR</span>
                    <Separator className="flex-1" />
                  </div>
                  
                  <Label htmlFor="airtable-record" className="block text-sm font-medium mb-2">Select from Airtable</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <AirtableRecordSelector onSelectRecord={handleAirtableRecordSelected} />
                    </div>
                    <Button 
                      onClick={handleCreateSession} 
                      disabled={!sessionName.trim() || isLoading} 
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <span>Create session</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-4">Recent Sessions</h4>
                {isLoadingSessions ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : recentSessions.length > 0 ? (
                  <div className="space-y-2">
                    {recentSessions.map(session => (
                      <div 
                        key={session.id} 
                        className="flex items-center justify-between p-4 rounded-md border border-border/40 bg-background/80 cursor-pointer hover:bg-background/90 transition-colors"
                        onClick={() => startSession(session.id, session.name)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{session.name}</div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(session.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => shareSessionLink(session.id, e)}
                              title="Partager le lien d'invitation"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            {copyTooltip === session.id && (
                              <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-background border rounded-md shadow-sm text-xs whitespace-nowrap">
                                Link copied!
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => deleteSession(session.id, e)}
                            title="Delete session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-md">
                    No recent sessions
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {showSettingsModal && (
        <RiceSettingsModal 
          open={showSettingsModal}
          onOpenChange={setShowSettingsModal}
        />
      )}
    </>
  );
} 