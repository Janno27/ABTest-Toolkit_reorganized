"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ThumbsUp, Mail, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface RiceSessionThankYouProps {
  sessionId: string;
}

export default function RiceSessionThankYou({ sessionId }: RiceSessionThankYouProps) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [isHost, setIsHost] = useState<boolean>(false);
  
  useEffect(() => {
    // Try to get user info from localStorage
    const storedUser = localStorage.getItem(`rice_session_${sessionId}_user`);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserName(parsedUser.name || "");
      } catch (error) {
        console.error("RiceSessionThankYou: Error parsing user data:", error);
      }
    }

    // Check if user is host
    const storedIsHost = localStorage.getItem(`rice_session_${sessionId}_is_host`);
    if (storedIsHost) {
      try {
        setIsHost(JSON.parse(storedIsHost));
      } catch (error) {
        console.error("RiceSessionThankYou: Error parsing host status:", error);
      }
    }
  }, [sessionId]);
  
  const handleReturn = () => {
    router.push("/");
  };

  const handleNewSession = () => {
    router.push("/rice/prioritization");
  };
  
  return (
    <Card className="p-6 max-w-xl mx-auto">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold">Thank You for Participating!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {userName ? `${userName}, thank` : "Thank"} you for taking part in this RICE prioritization session. 
            Your input is valuable and helps make better product decisions.
          </p>
        </div>
        
        <div className="bg-muted/20 p-4 rounded-lg">
          <div className="flex justify-center mb-3">
            <ThumbsUp className="h-6 w-6 text-green-500" />
          </div>
          <h3 className="text-lg font-medium">Your Contribution Matters</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The RICE prioritization framework helps teams make data-driven decisions
            about which features to build next. Your participation helps ensure these
            decisions are well-informed.
          </p>
        </div>
        
        <div className="pt-4">
          {isHost ? (
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button 
                onClick={handleReturn}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Return to Dashboard
              </Button>
              
              <Button 
                onClick={handleNewSession}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Start New Session</span>
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              The session is now complete. You can close this window.
            </div>
          )}
          
          <div className="mt-8 text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            <span>For feedback on this experiment, please contact the product team</span>
          </div>
        </div>
      </div>
    </Card>
  );
} 