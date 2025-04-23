"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RiceSessionSteps from "../session/RiceSessionSteps";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import supabaseRiceSessionService from "../../../services/db/SupabaseRiceSessionService";

interface RiceSessionParticipateProps {
  sessionId: string;
}

export default function RiceSessionParticipate({ sessionId }: RiceSessionParticipateProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");

  useEffect(() => {
    const checkSessionAndParticipant = async () => {
      try {
        setIsLoading(true);
        
        // Check if the session exists
        const session = await supabaseRiceSessionService.getSessionById(sessionId);
        if (!session) {
          setSessionExists(false);
          setIsLoading(false);
          return;
        }
        
        setSessionName(session.name);
        
        // Check if the user is a participant
        const storedUser = localStorage.getItem(`rice_session_${sessionId}_user`);
        if (!storedUser) {
          setIsParticipant(false);
          setIsLoading(false);
          return;
        }
        
        const user = JSON.parse(storedUser);
        setParticipantId(user.id);
        
        // Check if this participant exists in the session
        const isValidParticipant = session.participants && 
          session.participants.some((p: any) => p.id === user.id);
        
        setIsParticipant(isValidParticipant);
      } catch (error) {
        console.error("Error checking session and participant:", error);
        setSessionExists(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSessionAndParticipant();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!sessionExists) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="bg-destructive/10 p-6 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">Session not found</h2>
          <p className="text-muted-foreground mb-4">
            The session you are looking for does not exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/')}>
            Return to home
          </Button>
        </div>
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="bg-amber-500/10 p-6 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-bold text-amber-500 mb-2">Unauthorized access</h2>
          <p className="text-muted-foreground mb-4">
            You must first join this session before you can participate.
          </p>
          <Button onClick={() => router.push(`/rice/${sessionId}`)}>
            Join session
          </Button>
        </div>
      </div>
    );
  }

  // If everything is correct, display the existing RiceSessionSteps component
  return <RiceSessionSteps sessionId={sessionId} />;
} 