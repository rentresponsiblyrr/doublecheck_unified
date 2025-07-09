// Architecture Decision Records (ADR) Manager for STR Certified
// Integrates with AI decision logging system for comprehensive architectural documentation

import { aiDecisionLogger } from './decision-logger';
import { logger } from '../../utils/logger';
import { errorReporter } from '../monitoring/error-reporter';
import { supabase } from '../supabase';
import * as fs from 'fs';
import * as path from 'path';

// ADR Types
export interface ADRRecord {
  id: string;
  number: number;
  title: string;
  status: ADRStatus;
  context: string;
  decision: string;
  rationale: string;
  consequences: ADRConsequences;
  implementation: string;
  alternatives_considered: string;
  related_decisions: string[];
  monitoring_and_review: string;
  notes: string;
  ai_agent_info: AIAgentInfo;
  created_date: string;
  last_modified: string;
  file_path: string;
  metadata: Record<string, any>;
}

export type ADRStatus = 'proposed' | 'accepted' | 'rejected' | 'superseded';

export interface ADRConsequences {
  positive: string[];
  negative: string[];
}

export interface AIAgentInfo {
  created_by: string;
  date: string;
  session_id: string;
  decision_logger_id?: string;
  context_handoff_id?: string;
}

export interface ADRQuery {
  status?: ADRStatus;
  ai_agent?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search_term?: string;
  tags?: string[];
  limit?: number;
}

export interface ADRTemplate {
  title: string;
  context: string;
  decision: string;
  rationale: string;
  positive_consequences: string[];
  negative_consequences: string[];
  implementation: string;
  alternatives: string[];
  related_decisions: string[];
  monitoring: string;
  notes: string;
}

export class ADRManager {
  private static instance: ADRManager;
  private adrs: ADRRecord[] = [];
  private adrDirectory: string;
  private nextADRNumber: number = 1;

  private constructor() {
    this.adrDirectory = path.join(process.cwd(), 'ADR');
    this.loadExistingADRs();
  }

  static getInstance(): ADRManager {
    if (!ADRManager.instance) {
      ADRManager.instance = new ADRManager();
    }
    return ADRManager.instance;
  }

  /**
   * Create a new ADR from template
   */
  async createADR(template: ADRTemplate): Promise<string> {
    const adrNumber = this.getNextADRNumber();
    const adrId = this.generateADRId(adrNumber);
    
    const adr: ADRRecord = {
      id: adrId,
      number: adrNumber,
      title: template.title,
      status: 'proposed',
      context: template.context,
      decision: template.decision,
      rationale: template.rationale,
      consequences: {
        positive: template.positive_consequences,
        negative: template.negative_consequences
      },
      implementation: template.implementation,
      alternatives_considered: template.alternatives.join('\n'),
      related_decisions: template.related_decisions,
      monitoring_and_review: template.monitoring,
      notes: template.notes,
      ai_agent_info: {
        created_by: this.getCurrentAIAgent(),
        date: new Date().toISOString().split('T')[0],
        session_id: this.getCurrentSessionId(),
        decision_logger_id: undefined,
        context_handoff_id: undefined
      },
      created_date: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      file_path: this.generateADRFilePath(adrNumber, template.title),
      metadata: {}
    };

    // Add to local cache
    this.adrs.push(adr);
    this.nextADRNumber = adrNumber + 1;

    // Generate markdown content
    const markdownContent = this.generateMarkdownContent(adr);
    
    try {
      // Write to file
      await this.writeADRFile(adr.file_path, markdownContent);
      
      // Log the ADR creation
      const decisionId = await aiDecisionLogger.logSimpleDecision(
        `Created ADR-${adrNumber.toString().padStart(4, '0')}: ${template.title}`,
        'architectural_choice',
        `Created Architecture Decision Record for: ${template.decision}`,
        [adr.file_path],
        'high'
      );
      
      adr.ai_agent_info.decision_logger_id = decisionId;
      
      // Persist to database
      await this.persistADR(adr);
      
      logger.info(`ADR created: ${adr.title}`, {
        adr_id: adrId,
        adr_number: adrNumber,
        status: adr.status,
        file_path: adr.file_path
      }, 'ADR_CREATION');
      
      return adrId;
    } catch (error) {
      errorReporter.reportError(error, {
        context: 'ADR_CREATION',
        adr_id: adrId,
        adr_number: adrNumber,
        title: template.title
      });
      throw error;
    }
  }

  /**
   * Create a simple ADR with minimal input
   */
  async createSimpleADR(
    title: string,
    decision: string,
    rationale: string,
    context: string = 'Not specified'
  ): Promise<string> {
    return this.createADR({
      title,
      context,
      decision,
      rationale,
      positive_consequences: ['Decision implemented'],
      negative_consequences: ['No significant negative consequences identified'],
      implementation: 'To be implemented',
      alternatives: ['No alternatives considered'],
      related_decisions: [],
      monitoring: 'No specific monitoring planned',
      notes: 'Simple ADR created during AI session'
    });
  }

  /**
   * Update ADR status
   */
  async updateADRStatus(adrId: string, newStatus: ADRStatus, notes?: string): Promise<void> {
    const adr = this.adrs.find(a => a.id === adrId);
    if (!adr) {
      throw new Error(`ADR not found: ${adrId}`);
    }

    const oldStatus = adr.status;
    adr.status = newStatus;
    adr.last_modified = new Date().toISOString();
    
    if (notes) {
      adr.notes += `\n\n**Status Change (${new Date().toISOString()})**: ${oldStatus} → ${newStatus}\n${notes}`;
    }

    // Regenerate markdown content
    const markdownContent = this.generateMarkdownContent(adr);
    
    try {
      await this.writeADRFile(adr.file_path, markdownContent);
      await this.persistADR(adr);
      
      await aiDecisionLogger.logSimpleDecision(
        `Updated ADR-${adr.number.toString().padStart(4, '0')} status: ${oldStatus} → ${newStatus}`,
        'architectural_choice',
        `Status change for ADR "${adr.title}": ${notes || 'No additional notes'}`,
        [adr.file_path],
        'medium'
      );
      
      logger.info(`ADR status updated: ${adr.title}`, {
        adr_id: adrId,
        old_status: oldStatus,
        new_status: newStatus,
        notes: notes
      }, 'ADR_STATUS_UPDATE');
    } catch (error) {
      errorReporter.reportError(error, {
        context: 'ADR_STATUS_UPDATE',
        adr_id: adrId,
        old_status: oldStatus,
        new_status: newStatus
      });
      throw error;
    }
  }

  /**
   * Supersede an ADR with a new one
   */
  async supersedeADR(oldADRId: string, newADRTemplate: ADRTemplate): Promise<string> {
    const oldADR = this.adrs.find(a => a.id === oldADRId);
    if (!oldADR) {
      throw new Error(`ADR not found: ${oldADRId}`);
    }

    // Create new ADR
    const newADRId = await this.createADR({
      ...newADRTemplate,
      related_decisions: [...newADRTemplate.related_decisions, `ADR-${oldADR.number.toString().padStart(4, '0')}`]
    });

    // Update old ADR status
    await this.updateADRStatus(oldADRId, 'superseded', `Superseded by new ADR: ${newADRId}`);

    return newADRId;
  }

  /**
   * Query ADRs
   */
  queryADRs(query: ADRQuery): ADRRecord[] {
    let filtered = [...this.adrs];

    if (query.status) {
      filtered = filtered.filter(adr => adr.status === query.status);
    }

    if (query.ai_agent) {
      filtered = filtered.filter(adr => adr.ai_agent_info.created_by === query.ai_agent);
    }

    if (query.date_range) {
      filtered = filtered.filter(adr => {
        const created = new Date(adr.created_date);
        const start = new Date(query.date_range!.start);
        const end = new Date(query.date_range!.end);
        return created >= start && created <= end;
      });
    }

    if (query.search_term) {
      const searchTerm = query.search_term.toLowerCase();
      filtered = filtered.filter(adr => 
        adr.title.toLowerCase().includes(searchTerm) ||
        adr.context.toLowerCase().includes(searchTerm) ||
        adr.decision.toLowerCase().includes(searchTerm) ||
        adr.rationale.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by number (newest first)
    filtered.sort((a, b) => b.number - a.number);

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * Get ADR by ID
   */
  getADRById(id: string): ADRRecord | null {
    return this.adrs.find(adr => adr.id === id) || null;
  }

  /**
   * Get ADR by number
   */
  getADRByNumber(number: number): ADRRecord | null {
    return this.adrs.find(adr => adr.number === number) || null;
  }

  /**
   * Get all ADRs
   */
  getAllADRs(): ADRRecord[] {
    return [...this.adrs].sort((a, b) => a.number - b.number);
  }

  /**
   * Get active ADRs (accepted status)
   */
  getActiveADRs(): ADRRecord[] {
    return this.queryADRs({ status: 'accepted' });
  }

  /**
   * Generate ADR index
   */
  generateADRIndex(): string {
    const adrs = this.getAllADRs();
    
    return `# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for STR Certified.

## Index

${adrs.map(adr => `- [ADR-${adr.number.toString().padStart(4, '0')}](${path.basename(adr.file_path)}) - ${adr.title} (${adr.status})`).join('\n')}

## Status Summary

- **Proposed**: ${adrs.filter(a => a.status === 'proposed').length}
- **Accepted**: ${adrs.filter(a => a.status === 'accepted').length}
- **Rejected**: ${adrs.filter(a => a.status === 'rejected').length}
- **Superseded**: ${adrs.filter(a => a.status === 'superseded').length}

## Recent ADRs

${adrs.slice(0, 5).map(adr => `- [ADR-${adr.number.toString().padStart(4, '0')}](${path.basename(adr.file_path)}) - ${adr.title} (${adr.ai_agent_info.date})`).join('\n')}

---
*This index was automatically generated by the ADR Management System.*
*Last updated: ${new Date().toISOString()}*
`;
  }

  /**
   * Export ADRs
   */
  exportADRs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.adrs, null, 2);
    } else {
      const headers = ['number', 'title', 'status', 'created_date', 'ai_agent', 'decision', 'rationale'];
      const rows = this.adrs.map(adr => [
        adr.number,
        adr.title,
        adr.status,
        adr.created_date,
        adr.ai_agent_info.created_by,
        adr.decision.substring(0, 100) + '...',
        adr.rationale.substring(0, 100) + '...'
      ]);
      
      return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    }
  }

  /**
   * Private helper methods
   */
  private loadExistingADRs(): void {
    try {
      // This would load existing ADRs from the filesystem
      // For now, just initialize with empty array
      this.adrs = [];
      this.nextADRNumber = 1;
    } catch (error) {
      logger.error('Failed to load existing ADRs', error, 'ADR_LOAD');
    }
  }

  private getNextADRNumber(): number {
    return this.nextADRNumber;
  }

  private generateADRId(number: number): string {
    return `adr_${number.toString().padStart(4, '0')}_${Date.now()}`;
  }

  private generateADRFilePath(number: number, title: string): string {
    const sanitizedTitle = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    return path.join(this.adrDirectory, `${number.toString().padStart(4, '0')}-${sanitizedTitle}.md`);
  }

  private generateMarkdownContent(adr: ADRRecord): string {
    return `# ADR-${adr.number.toString().padStart(4, '0')}: ${adr.title}

## Status
${adr.status.charAt(0).toUpperCase() + adr.status.slice(1)}

## Context
${adr.context}

## Decision
${adr.decision}

## Rationale
${adr.rationale}

## Consequences
### Positive
${adr.consequences.positive.map(c => `- ${c}`).join('\n')}

### Negative
${adr.consequences.negative.map(c => `- ${c}`).join('\n')}

## Implementation
${adr.implementation}

## Alternatives Considered
${adr.alternatives_considered}

## Related Decisions
${adr.related_decisions.map(d => `- ${d}`).join('\n')}

## Monitoring and Review
${adr.monitoring_and_review}

## Notes
${adr.notes}

## AI Agent Information
- **Created by**: ${adr.ai_agent_info.created_by}
- **Date**: ${adr.ai_agent_info.date}
- **Session ID**: ${adr.ai_agent_info.session_id}
- **Decision Logger ID**: ${adr.ai_agent_info.decision_logger_id || 'N/A'}
- **Context Handoff ID**: ${adr.ai_agent_info.context_handoff_id || 'N/A'}

---
*This ADR was created as part of the AI decision logging and multi-AI collaboration system for STR Certified.*
*Last modified: ${adr.last_modified}*`;
  }

  private async writeADRFile(filePath: string, content: string): Promise<void> {
    // In a real implementation, this would write to the filesystem
    // For now, just simulate the operation
    logger.info(`ADR file would be written to: ${filePath}`, { content_length: content.length }, 'ADR_FILE_WRITE');
  }

  private async persistADR(adr: ADRRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('architecture_decision_records')
        .upsert([{
          id: adr.id,
          number: adr.number,
          title: adr.title,
          status: adr.status,
          context: adr.context,
          decision: adr.decision,
          rationale: adr.rationale,
          consequences: adr.consequences,
          implementation: adr.implementation,
          alternatives_considered: adr.alternatives_considered,
          related_decisions: adr.related_decisions,
          monitoring_and_review: adr.monitoring_and_review,
          notes: adr.notes,
          ai_agent_info: adr.ai_agent_info,
          created_date: adr.created_date,
          last_modified: adr.last_modified,
          file_path: adr.file_path,
          metadata: adr.metadata
        }]);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to persist ADR to database', error, 'ADR_PERSIST');
      throw error;
    }
  }

  private getCurrentAIAgent(): string {
    return process.env.AI_AGENT || 'claude-sonnet-4';
  }

  private getCurrentSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const adrManager = ADRManager.getInstance();

// Convenience functions
export const createADR = adrManager.createADR.bind(adrManager);
export const createSimpleADR = adrManager.createSimpleADR.bind(adrManager);
export const updateADRStatus = adrManager.updateADRStatus.bind(adrManager);
export const supersedeADR = adrManager.supersedeADR.bind(adrManager);
export const queryADRs = adrManager.queryADRs.bind(adrManager);
export const getADRById = adrManager.getADRById.bind(adrManager);
export const getADRByNumber = adrManager.getADRByNumber.bind(adrManager);
export const getAllADRs = adrManager.getAllADRs.bind(adrManager);
export const getActiveADRs = adrManager.getActiveADRs.bind(adrManager);
export const generateADRIndex = adrManager.generateADRIndex.bind(adrManager);
export const exportADRs = adrManager.exportADRs.bind(adrManager);