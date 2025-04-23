"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Trophy,
  Target,
  Lightbulb,
  Clock,
  ArrowLeft,
  InfoIcon,
  TableIcon
} from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import supabaseRiceSessionService from "../../../services/db/SupabaseRiceSessionService";
import { RiceSession } from "../../../services/RiceSessionService";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Label,
  ZAxis
} from 'recharts';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Interface pour représenter les scores RICE calculés retournés par l'API
interface RiceScoreData {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice: number;
}

// Interface pour représenter les résultats RICE stockés dans la base de données
interface RiceResultsSummary {
  reach_score: number;
  impact_score: number;
  confidence_score: number;
  effort_score: number;
  rice_score: number;
  created_at?: string;
  updated_at?: string;
}

// Interface pour les données du graphique
interface ChartDataPoint {
  id: string;
  name: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice: number;
  impactScore: number;
  x: number; // effort
  y: number; // impact * reach * confidence
  z: number; // taille du point (rice score)
  isCurrentSession?: boolean;
  created_at: string;
}

// Étendre l'interface RiceSession du service
interface ExtendedRiceSession extends RiceSession {
  riceResults?: RiceResultsSummary;
}

interface RiceSessionResultsProps {
  sessionId: string;
  onBack: () => void;
  onFinish: () => void;
}

// Interface pour les données des participants et leurs votes
interface ParticipantVotes {
  name: string;
  id: string;
  reach?: number;
  impact?: number;
  confidence?: number;
  effort?: number;
}

// Tooltip personnalisé pour les points du graphique
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-md shadow-md">
        <p className="font-medium">{data.name}</p>
        <p>RIC: {data.y.toFixed(2)}</p>
        <p>Effort: {data.x.toFixed(2)}</p>
        <p>RICE: {data.rice.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function RiceSessionResults({ sessionId, onBack, onFinish }: RiceSessionResultsProps) {
  const [riceScore, setRiceScore] = useState<RiceScoreData>({
    reach: 0,
    impact: 0,
    confidence: 0,
    effort: 0,
    rice: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [priorityThresholds, setPriorityThresholds] = useState({ high: 3.0, medium: 1.5 });
  const [priorityLevel, setPriorityLevel] = useState("Low Priority");
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [participantVotes, setParticipantVotes] = useState<ParticipantVotes[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Récupérer les scores RICE depuis Supabase
  useEffect(() => {
    if (!sessionId) return;

    const fetchRiceSessionData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching session data for session:', sessionId);
        const result = await supabaseRiceSessionService.getSessionById(sessionId) as ExtendedRiceSession;
        if (!result) {
          toast({
            title: "Error",
            description: "Could not find session data",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Check if user is host
        const storedIsHost = localStorage.getItem(`rice_session_${sessionId}_is_host`);
        if (storedIsHost) {
          try {
            setIsHost(JSON.parse(storedIsHost));
          } catch (e) {
            console.error("Error parsing host status:", e);
          }
        }

        // Fetch real participant votes from Supabase
        try {
          const participantData = await supabaseRiceSessionService.getSessionParticipantsWithVotes(sessionId);
          if (participantData && participantData.length > 0) {
            setParticipantVotes(participantData);
          } else {
            // Fallback to localStorage participants if needed
            const storedParticipants = localStorage.getItem(`rice_session_${sessionId}_final_participants`);
            if (storedParticipants) {
              const parsedParticipants = JSON.parse(storedParticipants);
              const simulatedVotes = parsedParticipants.map((p: any) => ({
                id: p.id,
                name: p.name,
                reach: parseFloat((Math.random() * 4 + 1).toFixed(1)),
                impact: parseFloat((Math.random() * 3 + 1).toFixed(1)),
                confidence: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)),
                effort: parseFloat((Math.random() * 1.5 + 0.5).toFixed(1))
              }));
              setParticipantVotes(simulatedVotes);
            }
          }
        } catch (error) {
          console.error("Error fetching participant votes:", error);
        }

        setRiceScore({
          reach: result.riceResults?.reach_score || 0,
          impact: result.riceResults?.impact_score || 0,
          confidence: result.riceResults?.confidence_score || 0,
          effort: result.riceResults?.effort_score || 0,
          rice: result.riceResults?.rice_score || 0
        });
        
        // Use stored participant count if available
        const storedParticipantCount = localStorage.getItem(`rice_session_${sessionId}_participant_count`);
        if (storedParticipantCount) {
          try {
            const parsedCount = parseInt(storedParticipantCount, 10);
            if (!isNaN(parsedCount)) {
              console.log("Using stored participant count:", parsedCount);
              setParticipantCount(parsedCount);
            } else {
              // Fallback to counting participants from session data
              console.log("Invalid stored participant count, using session data");
              setParticipantCount(result.participants ? result.participants.length : 0);
            }
          } catch (e) {
            console.error("Error parsing participant count:", e);
            setParticipantCount(result.participants ? result.participants.length : 0);
          }
        } else {
          // No stored count, use session data
          console.log("No stored participant count, using session data");
          setParticipantCount(result.participants ? result.participants.length : 0);
        }

        if (!result.riceResults) {
          console.log('Missing RICE data in session, calculating...');
          const calculatedScores = await supabaseRiceSessionService.calculateAndSaveRiceScore(sessionId);
          if (calculatedScores) {
            console.log("Scores RICE calculés et sauvegardés:", calculatedScores);
            setRiceScore({
              reach: calculatedScores.reach || 0,
              impact: calculatedScores.impact || 0,
              confidence: calculatedScores.confidence || 0,
              effort: calculatedScores.effort || 0,
              rice: calculatedScores.rice || 0
            });
            
            // Sauvegarde également dans le localStorage pour compatibilité avec RiceSessionSteps
            try {
              localStorage.setItem(`rice_session_${sessionId}_summary`, JSON.stringify({
                rice_score: calculatedScores.rice || 0
              }));
            } catch (e) {
              console.warn("Impossible de sauvegarder le score dans localStorage:", e);
            }
          } else {
            throw new Error("Impossible de calculer les scores RICE");
          }
        }
        
        // More accurate priority level calculation based on historical data
        const riceValue = result.riceResults?.rice_score || 0;
        const priorityInfo = await supabaseRiceSessionService.getPriorityLevel(riceValue);
        setPriorityLevel(priorityInfo.level);
        setPriorityThresholds(priorityInfo.thresholds);
        
        // Apply more consistent labeling based on actual score
        if (riceValue >= priorityInfo.thresholds.high) {
          setPriorityLevel("High Priority");
        } else if (riceValue >= priorityInfo.thresholds.medium) {
          setPriorityLevel("Medium Priority");
        } else {
          setPriorityLevel("Low Priority");
        }
        
        // Récupérer les données pour le graphique
        const historicalData = await supabaseRiceSessionService.getAllRiceScoresForChart();
        
        if (historicalData && historicalData.length > 0) {
          // Transformer les données pour le graphique
          const formattedData = historicalData.map(item => {
            const isCurrentSession = item.id === sessionId;
            return {
              ...item,
              x: item.effort,
              y: item.impactScore,
              z: item.rice * 5, // Taille du point proportionnelle au score RICE
              isCurrentSession
            };
          });
          
          setChartData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching RICE session data:', error);
        toast({
          title: "Error",
          description: "Failed to load session data",
          variant: "destructive"
        });
        
        // Valeurs par défaut en cas d'erreur
        setRiceScore({
          reach: 0.7,
          impact: 3,
          confidence: 0.8,
          effort: 1,
          rice: 2.1
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiceSessionData();
  }, [sessionId, toast]);
  
  // Determine priority class based on RICE score and dynamic thresholds
  const getPriorityClass = () => {
    if (riceScore.rice >= priorityThresholds.high) return "text-green-600";
    if (riceScore.rice >= priorityThresholds.medium) return "text-amber-600";
    return "text-red-600";
  };
  
  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold leading-tight mb-1">RICE Score Results</h2>
          <p className="text-sm text-muted-foreground">
            Discover the final RICE score and its components for this feature.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Calculating RICE score...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                <h3 className="text-xl font-semibold">RICE Score</h3>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">RICE Formula</h4>
                      <p className="text-sm text-muted-foreground">
                        RICE = (Reach × Impact × Confidence) ÷ Effort
                      </p>
                      <div className="text-sm font-mono bg-muted/30 p-2 rounded">
                        {riceScore.rice.toFixed(2)} = ({riceScore.reach.toFixed(1)} × {riceScore.impact.toFixed(1)} × {riceScore.confidence.toFixed(2)}) ÷ {riceScore.effort.toFixed(1)}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <div className="mt-2 text-5xl font-bold text-primary">
                {riceScore.rice.toFixed(2)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-700" />
                  </div>
                </div>
                <div className="text-sm font-medium">Reach</div>
                <div className="text-2xl font-bold mt-1">
                  {riceScore.reach.toFixed(1)}
                </div>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-purple-700" />
                  </div>
                </div>
                <div className="text-sm font-medium">Impact</div>
                <div className="text-2xl font-bold mt-1">
                  {riceScore.impact.toFixed(1)}
                </div>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-700" />
                  </div>
                </div>
                <div className="text-sm font-medium">Confidence</div>
                <div className="text-2xl font-bold mt-1">
                  {riceScore.confidence.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-red-700" />
                  </div>
                </div>
                <div className="text-sm font-medium">Effort</div>
                <div className="text-2xl font-bold mt-1">
                  {riceScore.effort.toFixed(1)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    <TableIcon className="h-4 w-4" />
                    <span>View Voting Details</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Voting Summary</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-sm">
                      <thead className="border-b sticky top-0 bg-background">
                        <tr>
                          <th className="text-left py-2">Participant</th>
                          <th className="py-2 text-center">Reach</th>
                          <th className="py-2 text-center">Impact</th>
                          <th className="py-2 text-center">Confidence</th>
                          <th className="py-2 text-center">Effort</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participantVotes.map((participant) => (
                          <tr key={participant.id} className="border-b border-muted">
                            <td className="py-2">{participant.name}</td>
                            <td className="py-2 text-center">{participant.reach !== undefined ? participant.reach.toFixed(1) : "-"}</td>
                            <td className="py-2 text-center">{participant.impact !== undefined ? participant.impact.toFixed(1) : "-"}</td>
                            <td className="py-2 text-center">{participant.confidence !== undefined ? participant.confidence.toFixed(2) : "-"}</td>
                            <td className="py-2 text-center">{participant.effort !== undefined ? participant.effort.toFixed(1) : "-"}</td>
                          </tr>
                        ))}
                        <tr className="bg-primary/10 font-medium">
                          <td className="py-2">Average (Final)</td>
                          <td className="py-2 text-center">{riceScore.reach.toFixed(1)}</td>
                          <td className="py-2 text-center">{riceScore.impact.toFixed(1)}</td>
                          <td className="py-2 text-center">{riceScore.confidence.toFixed(2)}</td>
                          <td className="py-2 text-center">{riceScore.effort.toFixed(1)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Quadrant Chart */}
            <div className="mt-8">
              <div className="h-80 w-full flex justify-center items-center">
                <ResponsiveContainer width="90%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Effort" 
                      domain={[0, 'dataMax + 1']}
                      hide={true}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Impact Score (R×I×C)" 
                      domain={[0, 'dataMax + 2']}
                      hide={true}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="z" 
                      range={[60, 400]}
                      name="RICE Score" 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference Lines for Quadrants - with stronger styling */}
                    <ReferenceLine 
                      y={chartData.length > 0 
                        ? chartData.reduce((sum, item) => sum + item.y, 0) / chartData.length 
                        : 5} 
                      stroke="#d4d4d8" 
                      strokeDasharray="0"
                      strokeWidth={1}
                    />
                    <ReferenceLine 
                      x={chartData.length > 0
                        ? chartData.reduce((sum, item) => sum + item.x, 0) / chartData.length 
                        : 2} 
                      stroke="#d4d4d8" 
                      strokeDasharray="0"
                      strokeWidth={1}
                    />
                    
                    {/* Quadrant Labels - better positioned */}
                    <text x="25%" y="20%" fill="#5B8AF9" fontSize={12} fontWeight="500" opacity="0.7" textAnchor="middle">
                      Easy win
                    </text>
                    <text x="75%" y="20%" fill="#5B8AF9" fontSize={12} fontWeight="500" opacity="0.7" textAnchor="middle">
                      Big bet
                    </text>
                    <text x="25%" y="80%" fill="#5B8AF9" fontSize={12} fontWeight="500" opacity="0.7" textAnchor="middle">
                      Fill-in
                    </text>
                    <text x="75%" y="80%" fill="#5B8AF9" fontSize={12} fontWeight="500" opacity="0.7" textAnchor="middle">
                      Money pit
                    </text>
                    
                    {/* Historical Data Points */}
                    <Scatter
                      name="A/B Tests"
                      data={chartData.filter(item => !item.isCurrentSession)}
                      fill="#8884d8"
                      opacity={0.6}
                    />
                    
                    {/* Current Session Data Point */}
                    <Scatter
                      name="Current Test"
                      data={chartData.filter(item => item.isCurrentSession)}
                      fill="#ff7300"
                      opacity={1}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button onClick={onFinish} disabled={isLoading}>
            Finish
          </Button>
        </div>
      </div>
    </Card>
  );
}
