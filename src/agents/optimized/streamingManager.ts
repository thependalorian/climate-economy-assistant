/**
 * Enhanced Streaming Manager for Real-time Agent Responses
 * 
 * Provides token-by-token streaming, progress updates, and intermediate steps
 */

export interface StreamChunk {
  type: 'token' | 'step' | 'recommendation' | 'error' | 'complete';
  data: StreamData;
  timestamp: number;
  agent?: string;
  step?: string;
}

interface StreamData {
  message?: string;
  progress?: number;
  details?: unknown;
  token?: string;
  error?: string;
  recoverable?: boolean;
  [key: string]: unknown;
}

export interface StreamingOptions {
  includeSteps?: boolean;
  includeRecommendations?: boolean;
  tokenByToken?: boolean;
  maxChunkSize?: number;
}

interface GraphOutput {
  partner_recommendations?: Array<{
    partner_name: string;
    opportunity_type: string;
    relevance_score: number;
  }>;
  [key: string]: unknown;
}

export class EnhancedStreamingManager {
  private activeStreams: Map<string, WritableStreamDefaultWriter> = new Map();
  private streamCallbacks: Map<string, (chunk: StreamChunk) => void> = new Map();
  
  // Create a streaming session
  public createStream(
    sessionId: string
  ): ReadableStream<StreamChunk> {
    const { readable, writable } = new TransformStream<StreamChunk, StreamChunk>();
    const writer = writable.getWriter();
    
    this.activeStreams.set(sessionId, writer);
    
    return readable;
  }
  
  // Stream agent processing steps
  public async streamAgentStep(
    sessionId: string,
    agent: string,
    step: string,
    data: unknown
  ): Promise<void> {
    const writer = this.activeStreams.get(sessionId);
    if (!writer) return;
    
    const chunk: StreamChunk = {
      type: 'step',
      data: {
        message: `${agent} is ${step}...`,
        progress: this.calculateProgress(step),
        details: data
      },
      timestamp: Date.now(),
      agent,
      step
    };
    
    try {
      await writer.write(chunk);
    } catch (error) {
      console.error('Stream write error:', error);
    }
  }
  
  // Stream token-by-token LLM responses
  public async streamTokens(
    sessionId: string,
    agent: string,
    tokens: AsyncIterable<string>
  ): Promise<void> {
    const writer = this.activeStreams.get(sessionId);
    if (!writer) return;
    
    try {
      for await (const token of tokens) {
        const chunk: StreamChunk = {
          type: 'token',
          data: { token },
          timestamp: Date.now(),
          agent
        };
        
        await writer.write(chunk);
      }
    } catch (error) {
      console.error('Token streaming error:', error);
    }
  }
  
  // Stream partner recommendations as they're generated
  public async streamRecommendation(
    sessionId: string,
    agent: string,
    recommendation: unknown
  ): Promise<void> {
    const writer = this.activeStreams.get(sessionId);
    if (!writer) return;
    
    const chunk: StreamChunk = {
      type: 'recommendation',
      data: recommendation as StreamData,
      timestamp: Date.now(),
      agent
    };
    
    try {
      await writer.write(chunk);
    } catch (error) {
      console.error('Recommendation streaming error:', error);
    }
  }
  
  // Stream errors
  public async streamError(
    sessionId: string,
    agent: string,
    error: string
  ): Promise<void> {
    const writer = this.activeStreams.get(sessionId);
    if (!writer) return;
    
    const chunk: StreamChunk = {
      type: 'error',
      data: { error, recoverable: true },
      timestamp: Date.now(),
      agent
    };
    
    try {
      await writer.write(chunk);
    } catch (streamError) {
      console.error('Error streaming error:', streamError);
    }
  }
  
  // Complete the stream
  public async completeStream(
    sessionId: string,
    finalData: unknown
  ): Promise<void> {
    const writer = this.activeStreams.get(sessionId);
    if (!writer) return;
    
    const chunk: StreamChunk = {
      type: 'complete',
      data: finalData as StreamData,
      timestamp: Date.now()
    };
    
    try {
      await writer.write(chunk);
      await writer.close();
      this.activeStreams.delete(sessionId);
      this.streamCallbacks.delete(sessionId);
    } catch (error) {
      console.error('Stream completion error:', error);
    }
  }
  
  // Enhanced LangGraph streaming integration
  public createLangGraphStream(
    sessionId: string,
    graph: {
      stream: (input: unknown, config: unknown) => AsyncIterable<[unknown[], unknown]>;
      invoke: (input: unknown, config: unknown) => Promise<unknown>;
    },
    input: unknown,
    config: unknown = {}
  ): ReadableStream<StreamChunk> {
    const stream = this.createStream(sessionId);
    
    // Run the graph with streaming
    this.runGraphWithStreaming(sessionId, graph, input, config);
    
    return stream;
  }
  
  private async runGraphWithStreaming(
    sessionId: string,
    graph: {
      stream: (input: unknown, config: unknown) => AsyncIterable<[unknown[], unknown]>;
      invoke: (input: unknown, config: unknown) => Promise<unknown>;
    },
    input: unknown,
    config: unknown
  ): Promise<void> {
    try {
      // Stream the graph execution
      const graphStream = graph.stream(input, {
        ...(config as Record<string, unknown>),
        streamMode: 'updates',
        subgraphs: true
      });
      
      for await (const chunk of graphStream) {
        // Extract node information
        const [nodeInfo, nodeOutput] = chunk;
        
        if ((nodeInfo as unknown[]).length === 0) {
          // Main graph node
          const nodeName = Object.keys(nodeOutput as Record<string, unknown>)[0];
          await this.streamAgentStep(
            sessionId,
            this.extractAgentName(nodeName),
            'processing',
            { node: nodeName, output: (nodeOutput as Record<string, unknown>)[nodeName] }
          );
        } else {
          // Subgraph node
          const subgraphPath = (nodeInfo as string[]).join(' -> ');
          await this.streamAgentStep(
            sessionId,
            this.extractAgentName(subgraphPath),
            'subgraph_processing',
            { path: subgraphPath, output: nodeOutput }
          );
        }
        
        // Stream partner recommendations if present
        if (nodeOutput && typeof nodeOutput === 'object') {
          const output = Object.values(nodeOutput as Record<string, unknown>)[0] as GraphOutput;
          if (output?.partner_recommendations) {
            for (const rec of output.partner_recommendations) {
              await this.streamRecommendation(sessionId, 'system', rec);
            }
          }
        }
      }
      
      // Get final result
      const finalResult = await graph.invoke(input, config);
      await this.completeStream(sessionId, finalResult);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.streamError(sessionId, 'system', errorMessage);
      await this.completeStream(sessionId, { error: errorMessage });
    }
  }
  
  // Progress calculation helper
  private calculateProgress(step: string): number {
    const stepProgress: Record<string, number> = {
      'memory_management': 10,
      'supervisor': 20,
      'career_analysis': 40,
      'partner_matching': 60,
      'response_generation': 80,
      'human_approval': 90,
      'complete': 100
    };
    
    return stepProgress[step] || 0;
  }
  
  // Extract agent name from node path
  private extractAgentName(nodePath: string): string {
    if (nodePath.includes('career')) return 'career_specialist';
    if (nodePath.includes('veterans')) return 'veterans_specialist';
    if (nodePath.includes('international')) return 'international_specialist';
    if (nodePath.includes('ej')) return 'ej_specialist';
    if (nodePath.includes('supervisor')) return 'supervisor';
    return 'system';
  }
  
  // Cleanup inactive streams
  public cleanupStreams(): void {
    for (const [, writer] of this.activeStreams.entries()) {
      try {
        writer.close();
      } catch (error) {
        console.error('Error closing stream:', error);
      }
    }
    
    this.activeStreams.clear();
    this.streamCallbacks.clear();
  }
  
  // Get active stream count
  public getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}

// Singleton instance
export const streamingManager = new EnhancedStreamingManager(); 