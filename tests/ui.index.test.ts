import { describe, it, expect, vi } from 'vitest';
import { createUi } from '../src/ui/index.js';

describe('UI Index', () => {
  it('creates UI with all components', () => {
    const ui = createUi();
    
    expect(ui.colors).toBeDefined();
    expect(ui.spinner).toBeDefined();
    expect(ui.prompt).toBeDefined();
    expect(ui.box).toBeDefined();
  });

  it('creates colors object', () => {
    const ui = createUi();
    
    expect(ui.colors.bold).toBeDefined();
    expect(ui.colors.green).toBeDefined();
    expect(ui.colors.red).toBeDefined();
    expect(ui.colors.yellow).toBeDefined();
    expect(ui.colors.blue).toBeDefined();
    expect(ui.colors.magenta).toBeDefined();
    expect(ui.colors.cyan).toBeDefined();
  });

  it('creates spinner function', () => {
    const ui = createUi();
    
    expect(typeof ui.spinner).toBe('function');
    const spinner = ui.spinner('test');
    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.stop).toBe('function');
  });

  it('creates prompt object with input and select', () => {
    const ui = createUi();
    
    expect(ui.prompt.input).toBeDefined();
    expect(ui.prompt.select).toBeDefined();
    expect(typeof ui.prompt.input).toBe('function');
    expect(typeof ui.prompt.select).toBe('function');
  });

  it('creates box function', () => {
    const ui = createUi();
    
    expect(typeof ui.box).toBe('function');
  });

  it('creates new UI instance each time', () => {
    const ui1 = createUi();
    const ui2 = createUi();
    
    expect(ui1).not.toBe(ui2);
    expect(ui1.colors).not.toBe(ui2.colors);
  });

  it('spinner function accepts string parameter', () => {
    const ui = createUi();
    const spinner = ui.spinner('test spinner');
    
    expect(spinner).toBeDefined();
    expect(typeof spinner.setText).toBe('function');
  });

  it('spinner function accepts options parameter', () => {
    const ui = createUi();
    const spinner = ui.spinner({ text: 'test', intervalMs: 100 });
    
    expect(spinner).toBeDefined();
    expect(typeof spinner.setInterval).toBe('function');
  });

  it('spinner function accepts no parameters', () => {
    const ui = createUi();
    const spinner = ui.spinner();
    
    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
  });

  it('box function calls drawBox with correct parameters', () => {
    const ui = createUi();
    const boxSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    ui.box('test message', 'test title');
    
    expect(boxSpy).toHaveBeenCalledWith(expect.stringContaining('test message'));
    expect(boxSpy).toHaveBeenCalledWith(expect.stringContaining('test title'));
    
    boxSpy.mockRestore();
  });

  it('box function calls drawBox without title', () => {
    const ui = createUi();
    const boxSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    ui.box('test message');
    
    expect(boxSpy).toHaveBeenCalledWith(expect.stringContaining('test message'));
    expect(boxSpy).toHaveBeenCalledWith(expect.not.stringContaining('test title'));
    
    boxSpy.mockRestore();
  });
});
