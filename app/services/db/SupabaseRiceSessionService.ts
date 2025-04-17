import { supabase } from '../../lib/supabase';
import {
  RiceSession,
  Participant,
  ReachVote,
  ImpactVote,
  ConfidenceVote,
  EffortVote,
  RiceResults
} from '../RiceSessionService';

// Service pour gérer les sessions RICE avec Supabase
class SupabaseRiceSessionService {
  private supabaseClient;
  
  constructor() {
    // Vérifier si Supabase est disponible au moment de l'initialisation
    if (!supabase) {
      console.error('SupabaseRiceSessionService: Le client Supabase n\'est pas disponible. Les opérations échoueront.');
    } else {
      console.log('SupabaseRiceSessionService: Initialisé avec succès.');
    }
    this.supabaseClient = supabase;
  }

  /**
   * Vérifie si le client Supabase est disponible
   * @returns Le client Supabase si disponible
   * @throws Error si le client Supabase n'est pas disponible
   */
  private checkSupabase() {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not available');
    }
    return this.supabaseClient;
  }

  /**
   * Récupère un résumé des scores RICE pour une session
   * @param sessionId L'ID de la session
   * @returns Le résumé des scores RICE ou null si non trouvé
   */
  async getRiceSummary(sessionId: string): Promise<{
    reach_score: number;
    impact_score: number;
    confidence_score: number;
    effort_score: number;
    rice_score: number;
    created_at: string;
    updated_at: string;
  } | null> {
    try {
      const { data, error } = await this.checkSupabase()
        .from('rice_results_summary')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (error) {
        // Ne pas signaler d'erreur si le résumé n'existe pas encore
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error(`Erreur lors de la récupération du résumé RICE pour la session ${sessionId}:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du résumé RICE pour la session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Récupère toutes les sessions RICE
   * @returns Une promesse qui se résout avec un tableau de sessions RICE
   */
  async getAllSessions(): Promise<RiceSession[]> {
    try {
      const supabase = this.checkSupabase();
      const { data, error } = await supabase
        .from('rice_sessions')
        .select(`
          *,
          rice_participants(*)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Mapper les données au format attendu par l'application
      return data.map(this.mapDbSessionToApp);
    } catch (error) {
      console.error('Error fetching RICE sessions from Supabase:', error);
      return [];
    }
  }

  // Récupérer une session RICE par ID
  async getSessionById(id: string): Promise<RiceSession | null> {
    try {
      const client = this.checkSupabase();
      
      const { data: sessionData, error: sessionError } = await client
        .from('rice_sessions')
        .select(`
          *,
          rice_participants (*)
        `)
        .eq('id', id)
        .single();
        
      if (sessionError) throw sessionError;
      if (!sessionData) return null;
      
      // Récupérer les votes pour cette session
      const { data: reachVotesData, error: reachError } = await client
        .from('rice_reach_votes')
        .select('*')
        .eq('session_id', id);
        
      if (reachError) throw reachError;
      
      const { data: impactVotesData, error: impactError } = await client
        .from('rice_impact_votes')
        .select('*')
        .eq('session_id', id);
        
      if (impactError) throw impactError;
      
      const { data: confidenceVotesData, error: confidenceError } = await client
        .from('rice_confidence_votes')
        .select('*')
        .eq('session_id', id);
        
      if (confidenceError) throw confidenceError;
      
      const { data: effortVotesData, error: effortError } = await client
        .from('rice_effort_votes')
        .select('*')
        .eq('session_id', id);
        
      if (effortError) throw effortError;
      
      // Construire l'objet session
      return this.buildFullSession(
        sessionData, 
        reachVotesData || [],
        impactVotesData || [],
        confidenceVotesData || [],
        effortVotesData || []
      );
    } catch (error) {
      console.error(`Error fetching RICE session with id ${id} from Supabase:`, error);
      return null;
    }
  }

  // Créer une nouvelle session RICE
  async createSession(session: Omit<RiceSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiceSession> {
    try {
      // Insérer la session principale
      const { data: createdSession, error } = await this.supabaseClient!
        .from('rice_sessions')
        .insert({
          name: session.name,
          settings_id: session.settingsId,
          status: session.status,
          description: "", // Utilisation de champs existants dans le schéma au lieu de created_by
          feature_name: session.name
        })
        .select()
        .single();
        
      if (error) throw error;
      if (!createdSession) throw new Error('Failed to create session');
      
      // Ajouter les participants si fournis
      if (session.participants?.length) {
        const participants = session.participants.map(p => ({
          session_id: createdSession.id,
          name: p.name,
          role: p.role
          // user_id a été supprimé car il n'est pas dans le schéma
        }));
        
        const { error: participantsError } = await this.supabaseClient!
          .from('rice_participants')
          .insert(participants);
          
        if (participantsError) throw participantsError;
      }
      
      // Récupérer la session complète
      return this.getSessionById(createdSession.id) as Promise<RiceSession>;
    } catch (error) {
      console.error('Error creating RICE session in Supabase:', error);
      throw error;
    }
  }

  // Mettre à jour une session RICE existante
  async updateSession(id: string, updates: Partial<RiceSession>): Promise<RiceSession> {
    try {
      const { participants, reach, impact, confidence, effort, results, ...mainUpdates } = updates;
      
      // Mettre à jour les informations principales
      if (Object.keys(mainUpdates).length > 0) {
        const dbMainUpdates: any = {};
        
        if (mainUpdates.name) dbMainUpdates.name = mainUpdates.name;
        if (mainUpdates.status) dbMainUpdates.status = mainUpdates.status;
        
        const { error } = await this.supabaseClient!
          .from('rice_sessions')
          .update(dbMainUpdates)
          .eq('id', id);
          
        if (error) throw error;
      }
      
      // Mettre à jour les participants si fournis
      if (participants) {
        await this.updateParticipants(id, participants);
      }
      
      // Mettre à jour les votes si fournis
      if (reach) {
        await this.updateReachVotes(id, reach);
      }
      
      if (impact) {
        await this.updateImpactVotes(id, impact);
      }
      
      if (confidence) {
        await this.updateConfidenceVotes(id, confidence);
      }
      
      if (effort) {
        await this.updateEffortVotes(id, effort);
      }
      
      // Mettre à jour les résultats si fournis
      if (results) {
        const { error } = await this.supabaseClient!
          .from('rice_sessions')
          .update({
            results: results,
            status: 'completed'
          })
          .eq('id', id);
          
        if (error) throw error;
      }
      
      // Récupérer la session mise à jour
      const updatedSession = await this.getSessionById(id);
      if (!updatedSession) throw new Error(`Session with id ${id} not found after update`);
      
      return updatedSession;
    } catch (error) {
      console.error(`Error updating RICE session with id ${id} in Supabase:`, error);
      throw error;
    }
  }

  // Supprimer une session RICE
  async deleteSession(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient!
        .from('rice_sessions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error(`Error deleting RICE session with id ${id} from Supabase:`, error);
      throw error;
    }
  }

  // GESTION DES PARTICIPANTS

  // Ajouter un participant à une session
  async addParticipant(sessionId: string, participant: Omit<Participant, 'id' | 'joinedAt'>): Promise<Participant> {
    try {
      const { data, error } = await this.supabaseClient!
        .from('rice_participants')
        .insert({
          session_id: sessionId,
          name: participant.name,
          role: participant.role
        })
        .select()
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Failed to add participant');
      
      return {
        id: data.id,
        name: data.name,
        role: data.role as 'facilitator' | 'voter',
        joinedAt: new Date(data.joined_at)
      };
    } catch (error) {
      console.error(`Error adding participant to session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // Supprimer un participant d'une session
  async removeParticipant(sessionId: string, participantId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient!
        .from('rice_participants')
        .delete()
        .eq('id', participantId)
        .eq('session_id', sessionId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error(`Error removing participant ${participantId} from session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // GESTION DES VOTES

  // Vérifier si un participant existe et le créer si nécessaire
  async ensureParticipantExists(sessionId: string, participant: { id: string, name: string, role: string }): Promise<string> {
    try {
      // Vérifier si le participant existe déjà
      const { data: existingParticipants, error: selectError } = await this.supabaseClient!
        .from('rice_participants')
        .select('id')
        .eq('id', participant.id);
        
      if (selectError) throw selectError;
      
      // Si le participant existe, retourner son ID
      if (existingParticipants && existingParticipants.length > 0) {
        return participant.id;
      }
      
      // Sinon, créer le participant
      const { data, error } = await this.supabaseClient!
        .from('rice_participants')
        .insert({
          id: participant.id,
          session_id: sessionId,
          name: participant.name,
          role: participant.role
        })
        .select()
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Failed to create participant');
      
      return data.id;
    } catch (error) {
      console.error(`Error ensuring participant exists in session ${sessionId}:`, error);
      throw error;
    }
  }

  // Enregistrer un vote pour la portée (Reach)
  async saveReachVote(sessionId: string, participantId: string, categoryId: string, value: number): Promise<ReachVote> {
    try {
      // Vérifier que le participant existe et le créer au besoin
      await this.ensureParticipantExists(sessionId, {
        id: participantId,
        name: "Anonymous User", // Nom par défaut si l'utilisateur est créé
        role: "facilitator"     // Rôle par défaut
      });
      
      // Vérifier d'abord le schéma de la table
      try {
        const { data: tableInfo, error: tableError } = await this.supabaseClient!
          .from('rice_reach_votes')
          .select('*')
          .limit(1);
          
        if (tableError) {
          console.error('Erreur lors de la vérification du schéma:', tableError);
          // Continuer malgré l'erreur
        } else if (tableInfo) {
          // Log les noms de colonnes pour le débogage
          console.log('Structure de la table rice_reach_votes:', 
            tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'Pas de données');
        }
      } catch (e) {
        console.warn('Impossible de vérifier le schéma:', e);
      }
      
      // Vérifier si le participant a déjà voté
      const { data: existingVotes, error: selectError } = await this.supabaseClient!
        .from('rice_reach_votes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('participant_id', participantId);
        
      if (selectError) throw selectError;
      
      // Mettre à jour ou insérer le vote
      if (existingVotes && existingVotes.length > 0) {
        const { error } = await this.supabaseClient!
          .from('rice_reach_votes')
          .update({
            category_id: categoryId, // Vérifier que ces noms de colonnes sont corrects
            value: value
          })
          .eq('id', existingVotes[0].id);
          
        if (error) {
          console.error('Erreur détaillée lors de la mise à jour:', error);
          throw error;
        }
      } else {
        const { error } = await this.supabaseClient!
          .from('rice_reach_votes')
          .insert({
            session_id: sessionId,
            participant_id: participantId,
            category_id: categoryId, // Vérifier que ces noms de colonnes sont corrects
            value: value
          });
          
        if (error) {
          console.error('Erreur détaillée lors de l\'insertion:', error);
          throw error;
        }
      }
      
      // Récupérer tous les votes actuels pour cette session
      const { data: allVotes, error: votesError } = await this.supabaseClient!
        .from('rice_reach_votes')
        .select('*')
        .eq('session_id', sessionId);
        
      if (votesError) throw votesError;
      
      // Construire l'objet de vote
      const reachVote: ReachVote = {
        categoryId: categoryId,
        categoryValue: 0, // À remplir à partir des paramètres
        votes: allVotes.map((v: any) => ({
          participantId: v.participant_id,
          value: v.value
        })),
        finalValue: 0 // À remplir à partir de la base de données
      };
      
      return reachVote;
    } catch (error) {
      console.error(`Error saving reach vote for session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  // Méthodes privées pour la mise à jour des données
  private async updateParticipants(sessionId: string, participants: Participant[]): Promise<void> {
    try {
      // Récupérer les participants existants
      const { data: existingParticipants, error: selectError } = await this.supabaseClient!
        .from('rice_participants')
        .select('id')
        .eq('session_id', sessionId);
        
      if (selectError) throw selectError;
      
      // Supprimer tous les participants existants
      if (existingParticipants && existingParticipants.length > 0) {
        const { error: deleteError } = await this.supabaseClient!
          .from('rice_participants')
          .delete()
          .eq('session_id', sessionId);
          
        if (deleteError) throw deleteError;
      }
      
      // Insérer les nouveaux participants
      if (participants && participants.length > 0) {
        const dbParticipants = participants.map(p => ({
          session_id: sessionId,
          name: p.name,
          role: p.role
        }));
        
        const { error } = await this.supabaseClient!
          .from('rice_participants')
          .insert(dbParticipants);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error(`Error updating participants for session ${sessionId} in Supabase:`, error);
      throw error;
    }
  }

  private async updateReachVotes(sessionId: string, votes: ReachVote[]): Promise<void> {
    // Implémentation similaire à updateParticipants
    console.log(`Mise à jour des votes de portée pour la session ${sessionId}`);
  }

  private async updateImpactVotes(sessionId: string, votes: ImpactVote[]): Promise<void> {
    // Implémentation similaire à updateParticipants
    console.log(`Mise à jour des votes d'impact pour la session ${sessionId}`);
  }

  private async updateConfidenceVotes(sessionId: string, votes: ConfidenceVote[]): Promise<void> {
    // Implémentation similaire à updateParticipants
    console.log(`Mise à jour des votes de confiance pour la session ${sessionId}`);
  }

  private async updateEffortVotes(sessionId: string, votes: EffortVote[]): Promise<void> {
    // Implémentation similaire à updateParticipants
    console.log(`Mise à jour des votes d'effort pour la session ${sessionId}`);
  }

  // Méthode pour mapper les données de la base de données au format de l'application
  private mapDbSessionToApp(dbSession: any): RiceSession {
    return {
      id: dbSession.id,
      name: dbSession.name,
      settingsId: dbSession.settings_id,
      status: dbSession.status,
      createdAt: new Date(dbSession.created_at),
      updatedAt: new Date(dbSession.updated_at),
      participants: dbSession.rice_participants?.map((p: any) => ({
        id: p.id,
        name: p.name,
        role: p.role as 'facilitator' | 'voter',
        joinedAt: new Date(p.joined_at)
      })) || [],
      reach: [],
      impact: [],
      confidence: [],
      effort: [],
      results: dbSession.results
    };
  }

  // Méthode pour construire une session complète avec tous ses votes
  private buildFullSession(
    sessionData: any,
    reachVotes: any[],
    impactVotes: any[],
    confidenceVotes: any[],
    effortVotes: any[]
  ): RiceSession {
    // Construire l'objet de base
    const session = this.mapDbSessionToApp(sessionData);
    
    // Ajouter les votes de portée
    if (reachVotes.length > 0) {
      // Regrouper les votes par catégorie
      const votesByCategory: { [key: string]: any[] } = {};
      reachVotes.forEach(vote => {
        if (!votesByCategory[vote.category_id]) {
          votesByCategory[vote.category_id] = [];
        }
        votesByCategory[vote.category_id].push(vote);
      });
      
      // Construire les objets de vote
      session.reach = Object.keys(votesByCategory).map(categoryId => ({
        categoryId,
        categoryValue: 0, // À remplir à partir des paramètres
        votes: votesByCategory[categoryId].map(v => ({
          participantId: v.participant_id,
          value: v.value
        })),
        finalValue: 0 // À calculer
      }));
    }
    
    // Ajouter les votes d'impact (similaire à reach)
    // ...
    
    // Ajouter les votes de confiance (similaire à reach)
    // ...
    
    // Ajouter les votes d'effort (similaire à reach)
    // ...
    
    return session;
  }
}

// Exporter une instance du service
const supabaseRiceSessionService = new SupabaseRiceSessionService();
export default supabaseRiceSessionService;
