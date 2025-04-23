"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import supabaseRiceSessionService from "../../../services/db/SupabaseRiceSessionService";
import { useToast } from "@/app/hooks/use-toast";

interface RiceSessionInviteProps {
  sessionId: string;
}

export default function RiceSessionInvite({ sessionId }: RiceSessionInviteProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [sessionName, setSessionName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [sessionExists, setSessionExists] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setIsLoadingSession(true);
        // Fetch session details from Supabase
        const session = await supabaseRiceSessionService.getSessionById(sessionId);
        
        if (session) {
          setSessionName(session.name);
          setSessionExists(true);
        } else {
          setSessionExists(false);
        }
      } catch (error) {
        console.error("Error loading session data:", error);
        setSessionExists(false);
      } finally {
        setIsLoadingSession(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleJoinSession = async () => {
    if (!userName.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Create new participant in Supabase
      const newParticipant = await supabaseRiceSessionService.addParticipant(
        sessionId,
        {
          name: userName.trim(),
          role: "voter" // Guests are always voters, not facilitators
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
      
      toast({
        title: "Session joined",
        description: "You have successfully joined the RICE session"
      });
      
      // Redirect to the session page
      router.push(`/rice/${sessionId}/participate`);
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Unable to join RICE session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingSession) {
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

  return (
    <div 
      className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md max-w-2xl mx-auto"
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
        <div className="space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">Join RICE Session</h1>
            <h2 className="text-lg font-medium mt-1 text-primary">{sessionName}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">Your name</Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1 border-[0.5px] border-border/40 bg-background/60"
              />
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleJoinSession}
                disabled={!userName.trim() || isLoading}
                className="flex items-center gap-1 w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span>Join Session</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 