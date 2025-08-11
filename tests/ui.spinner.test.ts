import { describe, it, expect, vi } from 'vitest';
import { createUi } from '../src/ui/index';

describe('UI Spinner', () => {
  it('supports presets and updates', async () => {
    const ui = createUi();
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const sp = ui.spinner({ text: 'test', frames: 'line', intervalMs: 10 });
    sp.start();
    sp.setFrames('dots2').setColor(ui.colors.green).setText('updated');
    sp.succeed('done');
    expect(write).toHaveBeenCalled();
    write.mockRestore();
  });
});


