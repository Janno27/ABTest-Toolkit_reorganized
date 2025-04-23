"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, UserPlus, Crown, Users, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import supabaseRiceSessionService from "../../../services/db/SupabaseRiceSessionService";
import { useToast } from "@/app/hooks/use-toast";

interface Participant {
  id: string;
  name: string;
  role: "facilitator" | "voter";
  joinedAt: string | Date;
}

interface RiceSessionParticipantsProps {
  sessionId: string;
  onStartSession: () => void;
}

export default function RiceSessionParticipants({ sessionId, onStartSession }: RiceSessionParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userName, setUserName] = useState("");
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [recentSessions, setRecentSessions] = useState<Participant[]>([]);
  const [sessionName, setSessionName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [forceStepChange, setForceStepChange] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Get session details
        const storedSessionName = localStorage.getItem(`rice_session_${sessionId}_name`) || "New Session";
        setSessionName(storedSessionName);
        
        // Get current user from localStorage if it exists
        const storedUser = localStorage.getItem(`rice_session_${sessionId}_user`);
        
        // Fetch participants from Supabase (ce composant a BESOIN de faire cet appel)
        const session = await supabaseRiceSessionService.getSessionById(sessionId);
        
        if (session && session.participants) {
          setParticipants(session.participants);
          
          // If we have a stored user, check if they exist in the participants list
          if (storedUser) {
            const user = JSON.parse(storedUser);
            const matchingParticipant = session.participants.find((p: Participant) => p.id === user.id);
            
            if (matchingParticipant) {
              setCurrentUser(matchingParticipant);
              setIsJoining(false);
              setIsHost(matchingParticipant.role === "facilitator");
            } else {
              // User not found in participants list, they need to re-join
              localStorage.removeItem(`rice_session_${sessionId}_user`);
              setIsJoining(true);
            }
          } else {
            // No stored user, check if we should be host (if no host exists)
            const hasHost = session.participants.some((p: Participant) => p.role === "facilitator");
            setIsHost(!hasHost);
            setIsJoining(true);
          }
        } else {
          // No participants yet, first user will be host
          setIsHost(true);
          setIsJoining(true);
        }
      } catch (error) {
        console.error("Error loading session data:", error);
      }
    };

    fetchSessionData();
    
    // Réduire la fréquence du polling pour éviter les problèmes de performance
    const intervalId = setInterval(async () => {
      try {
        const session = await supabaseRiceSessionService.getSessionById(sessionId);
        if (session && session.participants) {
          // Only update if the data has changed (by comparing lengths for simplicity)
          if (session.participants.length !== participants.length) {
            setParticipants(session.participants);
          }
        }
      } catch (error) {
        console.error("Error polling for participant updates:", error);
      }
    }, 2000); // Polling moins fréquent, toutes les 5 secondes au lieu de 2
    
    return () => clearInterval(intervalId);
  }, [sessionId, participants.length]);

  // Function to check if step change is being forced
  useEffect(() => {
    // Poll for session status updates
    const checkForceStepChange = async () => {
      try {
        const session = await supabaseRiceSessionService.getSessionById(sessionId);
        if (session && session.status && session.status === 'voting_started') {
          // Force transition to next step
          onStartSession();
        }
      } catch (error) {
        console.error("Error checking session status:", error);
      }
    };

    const intervalId = setInterval(checkForceStepChange, 2000);
    return () => clearInterval(intervalId);
  }, [sessionId, onStartSession]);

  const handleJoinSession = async () => {
    if (!userName.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Create new participant in Supabase
      const newParticipant = await supabaseRiceSessionService.addParticipant(
        sessionId,
        {
          name: userName.trim(),
          role: isHost ? "facilitator" : "voter"
        }
      );
      
      // Save minimal user info to localStorage for session continuity
      localStorage.setItem(`rice_session_${sessionId}_user`, JSON.stringify({
        id: newParticipant.id,
        name: newParticipant.name,
        role: newParticipant.role
      }));
      
      // Also save it to a global key that other components can access
      localStorage.setItem("rice_current_user_id", newParticipant.id);
      
      // Stocker explicitement si l'utilisateur est un hôte pour les autres composants
      const isUserHost = newParticipant.role === "facilitator";
      localStorage.setItem(`rice_session_${sessionId}_is_host`, JSON.stringify(isUserHost));
      console.log(`Stored user host status in localStorage: ${isUserHost}`);
      
      console.log("Saved user to Supabase:", newParticipant);
      setCurrentUser(newParticipant);
      
      // Fetch updated participants list
      const session = await supabaseRiceSessionService.getSessionById(sessionId);
      if (session && session.participants) {
        setParticipants(session.participants);
      }
      
      setIsJoining(false);
    } catch (error) {
      console.error("Error joining session:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/rice/${sessionId}`;
    
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link copied",
      description: "The invitation link has been copied to your clipboard"
    });
    
    setShowCopyTooltip(true);
    setTimeout(() => setShowCopyTooltip(false), 2000);
  };
  
  const handleStartSession = async () => {
    try {
      // Sauvegarder le nombre final de participants
      localStorage.setItem(`rice_session_${sessionId}_participant_count`, participants.length.toString());
      console.log(`Saved participant count: ${participants.length} to localStorage`);

      // Sauvegarder la liste finale des participants à utiliser dans les autres étapes
      localStorage.setItem(`rice_session_${sessionId}_final_participants`, JSON.stringify(participants));
      
      // Confirmer le statut d'hôte avant de passer à l'étape suivante
      localStorage.setItem(`rice_session_${sessionId}_is_host`, JSON.stringify(true));
      console.log("Confirmed host status in localStorage before starting session");

      // Update session status to force all participants to the next step
      await supabaseRiceSessionService.updateSessionStatus(sessionId, 'voting_started');
      
      // Then proceed to next step for the host
      onStartSession();
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive"
      });
    }
  };

  const canStartSession = currentUser?.role === "facilitator" && participants.length >= 1;

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">RICE Prioritization Session</h1>
          <h2 className="text-lg font-medium mt-1 text-primary">{sessionName}</h2>
        </div>
        
        {isJoining ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">Your Name</Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1 border-[0.5px] border-border/40 bg-background/60"
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleJoinSession}
                disabled={!userName.trim() || isLoading}
                size="sm"
                className="flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                <span>{isHost ? "Join as Host" : "Join Session"}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Participants ({participants.length})
                </h3>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleCopyLink}
                    title="Copy invitation link"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span>Copy invitation link</span>
                  </Button>
                  {showCopyTooltip && (
                    <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-background border rounded-md shadow-sm text-xs">
                      Link copied!
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <div className="divide-y">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id} 
                      className="flex items-center justify-between p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center">
                        <span className="font-medium">{participant.name}</span>
                        {participant.role === "facilitator" && (
                          <Crown className="ml-2 h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(participant.joinedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {!canStartSession && isHost && (
              <div className="flex items-center p-2 rounded-md bg-amber-50 text-amber-800 text-sm">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Waiting for participants to join...</span>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={handleStartSession}
                disabled={!canStartSession}
                className="flex items-center gap-1"
              >
                <span>Start Session</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 