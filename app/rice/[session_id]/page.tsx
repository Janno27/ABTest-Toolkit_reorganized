"use client";

import { useParams } from "next/navigation";
import RiceSessionInvite from "@/app/components/rice/invite/RiceSessionInvite";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RiceSessionInvitePage() {
  const params = useParams();
  const sessionId = params.session_id as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            A/B Test Toolkit
          </h1>
          <p className="text-muted-foreground mb-3">
            Powerful tools to plan and analyze your A/B tests
          </p>
        </div>
        
        <Tabs defaultValue="prioritization" className="w-full">
          <div className="flex justify-center mb-4">
            <TabsList className="grid w-[600px] grid-cols-3">
              <TabsTrigger value="prioritization">Prioritization</TabsTrigger>
              <TabsTrigger value="duration" disabled className="text-muted-foreground/50">Duration Calculator</TabsTrigger>
              <TabsTrigger value="analysis" disabled className="text-muted-foreground/50">Results Analysis</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="prioritization">
            <RiceSessionInvite sessionId={sessionId} />
          </TabsContent>
        </Tabs>
        
      </div>
      <footer className="mt-12 text-center text-sm text-muted-foreground space-y-1">
        <p>A/B Test ToolKit © 2025</p>
        <p>For Emma - The Sleep Company - Created by Jean R.</p>
      </footer>
    </div>
  );
} 