"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Users, ThumbsUp, CheckCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useRiceSettingsService } from '../../../hooks/useRiceSettingsService';
import { RiceSettings, ImpactMetric } from '../../../types/RiceServiceTypes';
import { useToast } from "@/app/hooks/use-toast";
import supabaseRiceSessionService from "../../../services/db/SupabaseRiceSessionService";
import { ImpactVote } from "../../../services/RiceSessionService";

interface Vote {
  participantId: string;
  kpiId: string;
  value: number;
}

interface Participant {
  id: string;
  name: string;
  role: "facilitator" | "voter";
  joinedAt: Date;
}

interface RiceSessionImpactVotingProps {
  sessionId: string;
  onBack: () => void;
  onNext: () => void;
}

export default function RiceSessionImpactVoting({ sessionId, onBack, onNext }: RiceSessionImpactVotingProps) {
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [showVotes, setShowVotes] = useState(false);
  const [impactKPIs, setImpactKPIs] = useState<ImpactMetric[]>([]);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Use the hooks for toast and services
  const { toast } = useToast();
  const { service, isLoading: isServiceLoading, error: serviceError } = useRiceSettingsService();

  // Load session data, participants, impact KPIs, and votes
  useEffect(() => {
    const loadSessionData = async () => {
      setIsLoading(true);
      try {
        // Load session data from Supabase
        const session = await supabaseRiceSessionService.getSessionById(sessionId);
        if (!session) {
          toast({
            title: "Error",
            description: "Could not find session data",
            variant: "destructive"
          });
          return;
        }
        
        console.log("Session loaded:", session);
        
        // Set participants from session data
        setParticipants(session.participants || []);
        
        // Get the current user from localStorage
        // Try different localStorage keys that might contain user info
        let currentUserId = localStorage.getItem("rice_current_user_id");
        let currentUserData = null;
        
        console.log("Looking for user with ID:", currentUserId);
        
        // If no direct user ID, try to get from session-specific storage
        if (!currentUserId) {
          const sessionUser = localStorage.getItem(`rice_session_${sessionId}_user`);
          if (sessionUser) {
            try {
              const parsedUser = JSON.parse(sessionUser);
              currentUserId = parsedUser.id;
              currentUserData = parsedUser;
              console.log("Found user in session storage:", parsedUser);
            } catch (e) {
              console.error("Error parsing user data:", e);
            }
          }
        }
        
        // If still no user, check other potential localStorage keys
        if (!currentUserId) {
          // Try to find any user data in localStorage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('user')) {
              try {
                const value = localStorage.getItem(key);
                if (value) {
                  const parsed = JSON.parse(value);
                  if (parsed && parsed.id) {
                    console.log("Found potential user data in key:", key, parsed);
                    currentUserId = parsed.id;
                    currentUserData = parsed;
                    break;
                  }
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
        
        // If we found a user ID but not the data, try to find it in participants
        if (currentUserId && !currentUserData && session.participants) {
          const foundUser = session.participants.find(p => p.id === currentUserId);
          if (foundUser) {
            currentUserData = foundUser;
            console.log("Found user in participants:", foundUser);
          }
        }
        
        // If we have the user data, set it
        if (currentUserData) {
          console.log("Setting current user:", currentUserData);
          setCurrentUser(currentUserData);
        } else if (session.participants && session.participants.length > 0) {
          // If no user found but we have participants, use the first one
          console.log("No user found, using first participant:", session.participants[0]);
          setCurrentUser(session.participants[0]);
        } else {
          // Create a temporary user as fallback
          const tempUser = {
            id: uuidv4(),
            name: "Anonymous User",
            role: "facilitator" as const,
            joinedAt: new Date()
          };
          console.log("Creating temporary user:", tempUser);
          setCurrentUser(tempUser);
          
          // Save this temporary user to localStorage for future use
          localStorage.setItem("rice_current_user_id", tempUser.id);
          localStorage.setItem(`rice_session_${sessionId}_user`, JSON.stringify(tempUser));
        }
        
        // Load impact KPIs from settings
        if (service) {
          // Use the session's settingsId or default settings
          const settingsId = session.settingsId || '00000000-0000-0000-0000-000000000001';
          const settings = await service.getSettingsById(settingsId);
          
          if (settings && settings.impactMetrics && settings.impactMetrics.length > 0) {
            console.log('RiceSessionImpactVoting: Metrics loaded from Supabase:', settings.impactMetrics);
            setImpactKPIs(settings.impactMetrics);
          } else {
            console.warn('RiceSessionImpactVoting: No Impact metrics found, using defaults');
            // Default values
            const defaultImpactMetrics: ImpactMetric[] = [
              { id: uuidv4(), name: "Revenue Increase", description: "Directly increases revenue", points: 1.0, example: "Increases subscription revenue" },
              { id: uuidv4(), name: "Conversion Improvement", description: "Improves conversion rates", points: 0.9, example: "Higher checkout completion rate" },
              { id: uuidv4(), name: "Cost Reduction", description: "Reduces operational costs", points: 0.8, example: "Less manual customer support needed" },
              { id: uuidv4(), name: "User Satisfaction", description: "Improves user satisfaction scores", points: 0.7, example: "Improves NPS score" }
            ];
            setImpactKPIs(defaultImpactMetrics);
          }
        }
        
        // If session has impact data, load votes
        if (session.impact && session.impact.metricVotes) {
          // Convert complex metricVotes into simple Vote objects for this UI
          const flattenedVotes: Vote[] = [];
          
          // For each participant vote entry
          session.impact.metricVotes.forEach(voteEntry => {
            // For each metric in that participant's vote
            voteEntry.metrics.forEach(metric => {
              flattenedVotes.push({
                participantId: voteEntry.participantId,
                kpiId: metric.metricId,
                value: metric.value
              });
            });
          });
          
          if (flattenedVotes.length > 0) {
            setVotes(flattenedVotes);
            // Check if current user has already voted
            if (currentUser && flattenedVotes.some(v => v.participantId === currentUser.id)) {
              setHasVoted(true);
            }
          }
        }
        
      } catch (error) {
        console.error('Error loading session data:', error);
        toast({
          title: "Error",
          description: "Failed to load session data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSessionData();
  }, [sessionId, service, toast]);

  // Initialize user from localStorage
  useEffect(() => {
    // Initialize user from localStorage, regardless of session
    const initializeUser = () => {
      let userId = localStorage.getItem("rice_current_user_id");
      let userData = null;
      
      // Try session-specific storage first
      const sessionUser = localStorage.getItem(`rice_session_${sessionId}_user`);
      if (sessionUser) {
        try {
          userData = JSON.parse(sessionUser);
          userId = userData.id;
          console.log("Initializing user from session storage:", userData);
        } catch (e) {
          console.error("Error parsing session user data:", e);
        }
      }
      
      // If we have user data, set it immediately
      if (userData) {
        // Convert the role string to the right format if needed
        const formattedRole = userData.role === "host" ? "facilitator" : userData.role;
        
        const formattedUser: Participant = {
          id: userData.id,
          name: userData.name,
          role: formattedRole as "facilitator" | "voter",
          joinedAt: userData.joinedAt instanceof Date ? userData.joinedAt : new Date(userData.joinedAt)
        };
        
        console.log("Setting current user immediately:", formattedUser);
        setCurrentUser(formattedUser);
      } else if (userId) {
        // If we only have an ID but no data, create a temporary user
        const tempUser: Participant = {
          id: userId,
          name: "User " + userId.substring(0, 4),
          role: "facilitator",
          joinedAt: new Date()
        };
        console.log("Created temporary user from ID:", tempUser);
        setCurrentUser(tempUser);
      }
    };
    
    initializeUser();
  }, [sessionId]);

  // Update votes when a KPI is selected
  const handleVote = (kpiId: string) => {
    console.log("==== VOTE DEBUGGING ====");
    console.log("KPI clicked:", kpiId);
    console.log("handleVote called with kpiId:", kpiId);
    console.log("currentUser:", currentUser);
    console.log("All impact KPIs:", impactKPIs);
    console.log("==== END DEBUGGING ====");
    
    // If currentUser is null, create a temporary user as fallback
    let userForVoting = currentUser;
    
    if (!userForVoting) {
      console.log("No current user found, creating a temporary one");
      
      // Try to get userId from localStorage
      const userId = localStorage.getItem("rice_current_user_id") || uuidv4();
      
      // Create temporary user
      userForVoting = {
        id: userId,
        name: "Anonymous User",
        role: "facilitator" as const,
        joinedAt: new Date()
      };
      
      // Save this temporary user
      localStorage.setItem("rice_current_user_id", userId);
      localStorage.setItem(`rice_session_${sessionId}_user`, JSON.stringify(userForVoting));
      
      // Update component state
      setCurrentUser(userForVoting);
      console.log("Created temporary user:", userForVoting);
    }
    
    // Find the KPI to get its point value
    const kpi = impactKPIs.find(k => k.id === kpiId);
    if (!kpi) {
      console.log("KPI not found:", kpiId);
      return;
    }
    
    console.log("Creating vote with KPI:", kpi.name, "points:", kpi.points);
    
    // Create/update vote
    const newVote: Vote = {
      participantId: userForVoting.id,
      kpiId,
      value: kpi.points
    };
    
  // Utilisation de l'opérateur ! pour indiquer la non-nullité
  const updatedVotes = votes.filter(vote => vote.participantId !== userForVoting!.id);
    
    // Add the new vote
    const finalVotes = [...updatedVotes, newVote];
    setVotes(finalVotes);
    console.log("Updated votes:", finalVotes);
    
    // Just selecting doesn't count as voting until the user submits
    setHasVoted(false);
  };

  // Submit the vote to Supabase
  const submitVote = async () => {
    console.log("===== SUBMIT VOTE DEBUG =====");
    console.log("submitVote called, currentUser:", currentUser);
    console.log("sessionId:", sessionId);
    const userVote = getUserVote();
    console.log("Current vote:", userVote);
    console.log("All votes:", votes);
    console.log("============================");
    
    // Handle case where currentUser is null
    let userForVoting = currentUser;
    
    if (!userForVoting) {
      console.log("No current user found in submitVote, checking if we have a vote");
      
      // Try to reconstruct the user from localStorage
      const userId = localStorage.getItem("rice_current_user_id");
      const sessionUser = localStorage.getItem(`rice_session_${sessionId}_user`);
      
      if (sessionUser) {
        try {
          userForVoting = JSON.parse(sessionUser);
          console.log("Reconstructed user from localStorage:", userForVoting);
        } catch (e) {
          console.error("Error parsing user data:", e);
          toast({
            title: "Error",
            description: "Could not parse user data",
            variant: "destructive"
          });
          return;
        }
      } else if (userId) {
        // Create a temporary user with the ID
        userForVoting = {
          id: userId,
          name: "Anonymous User",
          role: "facilitator" as const,
          joinedAt: new Date()
        };
        console.log("Created temporary user from ID:", userForVoting);
        
        // Ensure the temporary user is saved to localStorage
        localStorage.setItem(`rice_session_${sessionId}_user`, JSON.stringify(userForVoting));
      } else {
        // No user information available
        console.error("Cannot submit vote: No user information available");
        toast({
          title: "Error",
          description: "Cannot submit vote: User information missing",
          variant: "destructive"
        });
        return;
      }
      
      // Update state for future operations
      setCurrentUser(userForVoting);
    }
    
    if (!userVote) {
      console.error("Cannot submit vote: No vote selected");
      toast({
        title: "Error",
        description: "Please select a KPI first",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Find current user's vote
      const vote = votes.find(vote => vote.participantId === userForVoting!.id);
      if (!vote) {
        console.error("Could not find vote for user:", userForVoting!.id);
        toast({
          title: "Error",
          description: "Could not find your vote",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Saving vote to Supabase:", {
        sessionId,
        participantId: userForVoting!.id,
        kpiId: vote.kpiId,
        value: vote.value
      });
      
      // Vérifier que le service Supabase est disponible
      if (!supabaseRiceSessionService) {
        console.error("Supabase Rice Session Service is not available");
        toast({
          title: "Error",
          description: "Connection to database service is not available",
          variant: "destructive"
        });
        return;
      }
      
      // Convert to the format expected by saveImpactVote
      const metrics = [{
        metricId: vote.kpiId,
        value: vote.value
      }];
      
      console.log("Calling saveImpactVote with metrics:", metrics);
      
      // Save to Supabase with the correct parameter format
      const result = await supabaseRiceSessionService.saveImpactVote(
        sessionId,
        userForVoting!.id,
        metrics
      );
      
      console.log("Result from saveImpactVote:", result);
      
      // Visual feedback for the user
      setVoteSubmitted(true);
      setHasVoted(true);
      
      // Store vote in localStorage as backup
      try {
        const localVotes = localStorage.getItem(`rice_session_${sessionId}_impact_votes`) 
          ? JSON.parse(localStorage.getItem(`rice_session_${sessionId}_impact_votes`) || '[]') 
          : [];
        
        // Remove any existing vote for this user
        const filteredVotes = localVotes.filter((v: any) => v.participantId !== userForVoting!.id);
        
        // Add the new vote
        filteredVotes.push({
          participantId: userForVoting!.id,
          metricId: vote.kpiId,
          value: vote.value,
          timestamp: new Date().toISOString()
        });
        
        localStorage.setItem(`rice_session_${sessionId}_impact_votes`, JSON.stringify(filteredVotes));
        console.log("Vote saved to localStorage as backup");
      } catch (e) {
        console.warn("Could not save vote to localStorage:", e);
      }
      
      toast({
        title: "Vote submitted",
        description: "Your Impact vote has been saved"
      });
      
      // Reset after animation
      setTimeout(() => {
        setVoteSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving vote:', error);
      
      // Get a more descriptive error message
      let errorMessage = "Failed to save your vote";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Error: ${(error as any).message}`;
      }
      
      console.error('Detailed error message:', errorMessage);
      
      // Try to extract Supabase error details if available
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('Supabase error code:', (error as any).code);
        console.error('Supabase error details:', (error as any).details);
      }
      
      toast({
        title: "Error",
        description: "Failed to save your vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get current user's vote
  const getUserVote = () => {
    if (!currentUser) return null;
    return votes.find(vote => vote.participantId === currentUser.id)?.kpiId || null;
  };

  // Calculate a summary of votes
  const getVoteSummary = () => {
    if (votes.length === 0) return { averagePoints: 0, total: 0 };
    
    const total = votes.length;
    let sumPoints = 0;
    
    votes.forEach(vote => {
      sumPoints += vote.value;
    });
    
    return {
      averagePoints: Math.round((sumPoints / total) * 100) / 100,
      total
    };
  };

  // Count votes for a KPI
  const getVoteCountForKPI = (kpiId: string) => {
    return votes.filter(vote => vote.kpiId === kpiId).length;
  };

  // Determine if votes can be revealed (for facilitator)
  const canRevealVotes = () => {
    if (!currentUser || currentUser.role !== "facilitator") return false;
    
    // Check if all participants have voted
    const voterIds = new Set(votes.map(vote => vote.participantId));
    return participants.every(participant => voterIds.has(participant.id));
  };

  const isFacilitator = currentUser?.role === "facilitator";
  const userVote = getUserVote();

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold leading-tight mb-1">Impact Evaluation</h2>
          <p className="text-sm text-muted-foreground">
            How significantly will this feature impact the business? Select the most relevant KPI.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-1" />
            <span>{participants.length} Participants</span>
          </div>
          
          {isFacilitator && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowVotes(!showVotes)}
              className="flex items-center"
            >
              {showVotes ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide votes
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show votes
                </>
              )}
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <span className="ml-3 text-sm text-muted-foreground">Loading KPIs...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {impactKPIs.map((kpi) => (
              <div 
                key={kpi.id}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  userVote === kpi.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => !hasVoted && handleVote(kpi.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <h3 className="font-medium">{kpi.name}</h3>
                      {userVote === kpi.id && (
                        <span className="ml-2 text-primary">
                          <CheckCircle className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {kpi.description}
                    </div>
                  </div>
                  
                  {showVotes && (
                    <div className="flex items-center text-sm">
                      <span className="font-semibold">{getVoteCountForKPI(kpi.id)}</span>
                      <Users className="h-4 w-4 ml-1" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showVotes && votes.length > 0 && (
          <div className="bg-muted/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Vote Summary</h3>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {getVoteSummary().total} / {participants.length} participants voted
              </div>
              <div className="font-semibold">
                Average score: {getVoteSummary().averagePoints.toFixed(2)}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex gap-3">
            {!hasVoted && userVote && (
              <Button 
                variant="default" 
                onClick={submitVote}
                disabled={isLoading || isSaving || !userVote}
                className={`relative ${voteSubmitted ? 'bg-green-600' : ''}`}
              >
                {isSaving ? (
                  <div className="h-5 w-5 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2"></div>
                ) : voteSubmitted ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <ThumbsUp className="mr-2 h-4 w-4" />
                )}
                {voteSubmitted ? "Voted!" : "Submit Vote"}
              </Button>
            )}
            
            <Button 
              variant={hasVoted ? "default" : "outline"} 
              onClick={onNext}
              disabled={isFacilitator && participants.length > 1 && votes.length < participants.length}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 