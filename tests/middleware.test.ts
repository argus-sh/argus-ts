import { describe, it, expect, vi } from 'vitest';
import { cli } from '../src/index';

describe('Middleware', () => {
  it('runs middleware in order and can short-circuit', async () => {
    const seq: string[] = [];
    const app = cli({ name: 'mw' });

    app.use(async (_ctx, next) => { seq.push('root-1'); await next(); seq.push('root-1-after'); });
    app.use(async (_ctx, next) => { seq.push('root-2'); await next(); seq.push('root-2-after'); });

    const sub = app.command('run', 'Run');
    sub.use(async (_ctx, next) => { seq.push('sub-1'); await next(); seq.push('sub-1-after'); });
    sub.action(() => { seq.push('action'); });

    await app.parse(['run']);
    expect(seq).toEqual(['root-1','root-2','sub-1','action','sub-1-after','root-2-after','root-1-after']);
  });
});


