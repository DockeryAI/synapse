/**
 * Background Job Scheduler - Manages and monitors background job execution
 * Phase 15: Background Jobs and Enrichment Engine
 */

import { supabase } from '@/lib/supabase';
import type {
  BackgroundJob,
  JobExecution,
  JobLog,
  JobStatusResponse,
} from '@/types/enrichment.types';

export class BackgroundJobScheduler {
  /**
   * Get all background jobs with their status
   */
  static async getAllJobs(): Promise<BackgroundJob[]> {
    try {
      const { data, error } = await supabase
        .from('background_jobs')
        .select('*')
        .order('name');

      if (error) throw error;

      return (data as BackgroundJob[]) || [];
    } catch (error) {
      console.error('Error getting background jobs:', error);
      return [];
    }
  }

  /**
   * Get job status and health
   */
  static async getJobStatus(jobName: string): Promise<JobStatusResponse> {
    try {
      const { data: job } = await supabase
        .from('background_jobs')
        .select('*')
        .eq('name', jobName)
        .single();

      if (!job) {
        return {
          job_name: jobName,
          status: 'failed',
          last_run: null,
          next_run: null,
          health: 'unhealthy',
        };
      }

      // Get last execution
      const { data: lastExecution } = await supabase
        .from('job_executions')
        .select('*')
        .eq('job_name', jobName)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      const health = this.calculateJobHealth(job, lastExecution);

      return {
        job_name: jobName,
        status: job.status,
        last_run: lastExecution
          ? {
              status: lastExecution.status,
              duration_ms: lastExecution.duration_ms || 0,
              brands_processed: lastExecution.brands_processed || 0,
              timestamp: lastExecution.started_at,
            }
          : null,
        next_run: job.next_run_at,
        health,
      };
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  }

  /**
   * Start a job execution (called by cron functions)
   */
  static async startJobExecution(
    jobName: string
  ): Promise<{ execution_id: string }> {
    try {
      const executionId = crypto.randomUUID();

      // Create execution record
      await supabase.from('job_executions').insert({
        id: executionId,
        job_name: jobName,
        started_at: new Date().toISOString(),
        status: 'running',
      });

      // Update job last_run_at
      await supabase
        .from('background_jobs')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'running',
        })
        .eq('name', jobName);

      await this.log(jobName, 'info', `Job ${jobName} started`);

      return { execution_id: executionId };
    } catch (error) {
      console.error('Error starting job execution:', error);
      throw error;
    }
  }

  /**
   * Complete a job execution
   */
  static async completeJobExecution(
    executionId: string,
    result: {
      status: 'success' | 'failed';
      brands_processed?: number;
      items_processed?: number;
      error?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const completedAt = new Date().toISOString();

      // Get execution to calculate duration
      const { data: execution } = await supabase
        .from('job_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (!execution) {
        throw new Error('Execution not found');
      }

      const startedAt = new Date(execution.started_at);
      const duration = Date.now() - startedAt.getTime();

      // Update execution record
      await supabase
        .from('job_executions')
        .update({
          completed_at: completedAt,
          status: result.status,
          duration_ms: duration,
          brands_processed: result.brands_processed || 0,
          items_processed: result.items_processed || 0,
          error: result.error || null,
          result: result.metadata || null,
        })
        .eq('id', executionId);

      // Update job record
      await supabase
        .from('background_jobs')
        .update({
          last_run_status: result.status,
          last_run_duration_ms: duration,
          last_error: result.error || null,
          success_count:
            result.status === 'success'
              ? supabase.rpc('increment', { field: 'success_count' })
              : undefined,
          failure_count:
            result.status === 'failed'
              ? supabase.rpc('increment', { field: 'failure_count' })
              : undefined,
          updated_at: completedAt,
        })
        .eq('name', execution.job_name);

      await this.log(
        execution.job_name,
        result.status === 'success' ? 'info' : 'error',
        `Job ${execution.job_name} ${result.status} in ${duration}ms`,
        { duration, ...result.metadata }
      );
    } catch (error) {
      console.error('Error completing job execution:', error);
      throw error;
    }
  }

  /**
   * Log a job event
   */
  static async log(
    jobName: string,
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('job_logs').insert({
        job_name: jobName,
        level,
        message,
        metadata: metadata || null,
        timestamp: new Date().toISOString(),
      });

      // Also log to console
      const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      logFn(`[${jobName}] ${message}`, metadata || '');
    } catch (error) {
      console.error('Error logging job event:', error);
    }
  }

  /**
   * Get job logs
   */
  static async getJobLogs(
    jobName: string,
    options: {
      limit?: number;
      level?: 'info' | 'warn' | 'error';
      since?: string;
    } = {}
  ): Promise<JobLog[]> {
    try {
      let query = supabase
        .from('job_logs')
        .select('*')
        .eq('job_name', jobName)
        .order('timestamp', { ascending: false });

      if (options.level) {
        query = query.eq('level', options.level);
      }

      if (options.since) {
        query = query.gte('timestamp', options.since);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data } = await query;

      return (data as JobLog[]) || [];
    } catch (error) {
      console.error('Error getting job logs:', error);
      return [];
    }
  }

  /**
   * Get job execution history
   */
  static async getJobExecutions(
    jobName: string,
    limit: number = 20
  ): Promise<JobExecution[]> {
    try {
      const { data } = await supabase
        .from('job_executions')
        .select('*')
        .eq('job_name', jobName)
        .order('started_at', { ascending: false })
        .limit(limit);

      return (data as JobExecution[]) || [];
    } catch (error) {
      console.error('Error getting job executions:', error);
      return [];
    }
  }

  /**
   * Pause a job
   */
  static async pauseJob(jobName: string): Promise<void> {
    try {
      await supabase
        .from('background_jobs')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('name', jobName);

      await this.log(jobName, 'warn', `Job ${jobName} paused`);
    } catch (error) {
      console.error('Error pausing job:', error);
      throw error;
    }
  }

  /**
   * Resume a job
   */
  static async resumeJob(jobName: string): Promise<void> {
    try {
      await supabase
        .from('background_jobs')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('name', jobName);

      await this.log(jobName, 'info', `Job ${jobName} resumed`);
    } catch (error) {
      console.error('Error resuming job:', error);
      throw error;
    }
  }

  /**
   * Manually trigger a job (calls the edge function)
   */
  static async triggerJob(jobName: string): Promise<void> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${jobName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ manual_trigger: true }),
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger job: ${response.statusText}`);
      }

      await this.log(jobName, 'info', `Job ${jobName} manually triggered`);
    } catch (error) {
      console.error('Error triggering job:', error);
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  static async getJobStats(jobName: string): Promise<{
    total_executions: number;
    success_rate: number;
    avg_duration_ms: number;
    last_24h_executions: number;
  }> {
    try {
      const { data: executions } = await supabase
        .from('job_executions')
        .select('*')
        .eq('job_name', jobName);

      if (!executions || executions.length === 0) {
        return {
          total_executions: 0,
          success_rate: 0,
          avg_duration_ms: 0,
          last_24h_executions: 0,
        };
      }

      const successCount = executions.filter((e) => e.status === 'success').length;
      const totalDuration = executions.reduce(
        (sum, e) => sum + (e.duration_ms || 0),
        0
      );

      const last24h = executions.filter(
        (e) =>
          new Date(e.started_at) >
          new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      return {
        total_executions: executions.length,
        success_rate: (successCount / executions.length) * 100,
        avg_duration_ms: totalDuration / executions.length,
        last_24h_executions: last24h,
      };
    } catch (error) {
      console.error('Error getting job stats:', error);
      return {
        total_executions: 0,
        success_rate: 0,
        avg_duration_ms: 0,
        last_24h_executions: 0,
      };
    }
  }

  /**
   * Calculate job health status
   */
  private static calculateJobHealth(
    job: BackgroundJob,
    lastExecution: JobExecution | null
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // If job is paused, it's degraded
    if (job.status === 'paused') return 'degraded';

    // If job has failed status, it's unhealthy
    if (job.status === 'failed') return 'unhealthy';

    // If no last execution, it's degraded
    if (!lastExecution) return 'degraded';

    // If last execution failed, it's unhealthy
    if (lastExecution.status === 'failed') return 'unhealthy';

    // Calculate success rate
    const total = job.success_count + job.failure_count;
    if (total === 0) return 'degraded';

    const successRate = job.success_count / total;

    // If success rate < 70%, degraded
    if (successRate < 0.7) return 'degraded';

    // If success rate < 90%, check recent failures
    if (successRate < 0.9 && job.last_run_status === 'failed') {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Clean up old job logs (keep last 30 days)
   */
  static async cleanupOldLogs(): Promise<void> {
    try {
      const cutoffDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      await supabase.from('job_logs').delete().lt('timestamp', cutoffDate);

      await supabase
        .from('job_executions')
        .delete()
        .lt('started_at', cutoffDate);
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }
}
