import type { CliExecutor } from '../types.js';
import { ArgusError } from '../errors/index.js';

export type TestHarness = {
  execute: (args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
};

export function createTestHarness(program: CliExecutor): TestHarness {
  return {
    async execute(args: string[]) {
      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      // Keep originals to restore later
      const originalLog = console.log;
      const originalError = console.error;
      const originalStdoutWrite = process.stdout.write;
      const originalStderrWrite = process.stderr.write;
      const originalExit = process.exit;
      const originalArgusPrint = ArgusError.prototype.print;

      // Flags to infer error/help flows
      let hadArgusErrorPrinted = false;
      let hadHelpPrinted = false;

      function append(target: 'out' | 'err', chunk: any) {
        const text = typeof chunk === 'string' ? chunk : String(chunk);
        if (target === 'out') stdout += text;
        else stderr += text;
      }

      try {
        // Capture console methods
        console.log = (...items: any[]) => {
          const text = items.map(i => (typeof i === 'string' ? i : String(i))).join(' ');
          if (text.includes('Usage:')) hadHelpPrinted = true;
          append('out', text + '\n');
        };
        console.error = (...items: any[]) => {
          const text = items.map(i => (typeof i === 'string' ? i : String(i))).join(' ');
          append('err', text + '\n');
        };
        // Capture direct writes
        (process.stdout as any).write = (chunk: any) => { append('out', chunk); return true; };
        (process.stderr as any).write = (chunk: any) => { append('err', chunk); return true; };
        // Suppress process.exit and record exit code
        (process as any).exit = (code?: number) => { exitCode = typeof code === 'number' ? code : 0; };
        // Intercept ArgusError prints to infer failure intent
        ArgusError.prototype.print = function patchedPrint(ui?: any) {
          hadArgusErrorPrinted = true;
          try {
            append('err', `Error:\n${this.format(ui)}\n`);
          } catch {}
          return originalArgusPrint.call(this, ui);
        };

        try {
          await program.parse(args);
        } catch (err) {
          exitCode = 1;
          if (err instanceof Error) {
            append('err', (err.stack ?? err.message ?? String(err)) + '\n');
          } else {
            append('err', String(err) + '\n');
          }
        }

        // If the program printed an ArgusError, mark as failure
        if (hadArgusErrorPrinted) {
          exitCode = exitCode === 0 ? 1 : exitCode;
        }
        // If help was printed without explicit --help, likely an error path
        if (!args.includes('--help') && hadHelpPrinted) {
          exitCode = exitCode === 0 ? 1 : exitCode;
        }

        return { stdout, stderr, exitCode };
      } finally {
        // Restore everything
        console.log = originalLog;
        console.error = originalError;
        (process.stdout as any).write = originalStdoutWrite as any;
        (process.stderr as any).write = originalStderrWrite as any;
        (process as any).exit = originalExit as any;
        ArgusError.prototype.print = originalArgusPrint;
      }
    }
  };
}


