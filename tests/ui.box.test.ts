import { describe, it, expect, vi } from 'vitest';
import { drawBox } from '../src/ui/box.js';

describe('Box UI', () => {
  it('draws a basic box without title', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    drawBox('Hello\nWorld');
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('World'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('╭'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('╰'));
    
    logSpy.mockRestore();
  });

  it('draws a box with title', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    drawBox('Hello\nWorld', { title: 'Test Box' });
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Test Box'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('World'));
    
    logSpy.mockRestore();
  });

  it('draws a box with custom padding', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    drawBox('Hello', { padding: 3 });
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('   Hello   '));
    
    logSpy.mockRestore();
  });

  it('handles empty text gracefully', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    drawBox('');
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('╭'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('╰'));
    
    logSpy.mockRestore();
  });

  it('handles null/undefined text gracefully', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    drawBox(null as any);
    drawBox(undefined as any);
    
    expect(logSpy).toHaveBeenCalledTimes(2);
    
    logSpy.mockRestore();
  });

  it('handles single line text', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    drawBox('Single line');
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Single line'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('╭'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('╰'));
    
    logSpy.mockRestore();
  });

  it('handles text with varying line lengths', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    drawBox('Short\nVery long line here\nShort');
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Short'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Very long line here'));
    
    logSpy.mockRestore();
  });

  it('handles zero padding', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    drawBox('Hello', { padding: 0 });
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('│ Hello │'));
    
    logSpy.mockRestore();
  });

  it('handles negative padding by clamping to 0', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    drawBox('Hello', { padding: -5 });
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('│ Hello │'));
    
    logSpy.mockRestore();
  });
});
