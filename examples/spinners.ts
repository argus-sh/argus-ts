import { createUi } from '../src/ui/index';

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function demo() {
  const ui = createUi();

  // 1) Default dots
  const sp1 = ui.spinner('Default dots...').start();
  await sleep(500);
  sp1.succeed('Default done');

  // 2) Dots2 fast, yellow
  const sp2 = ui.spinner({ text: 'Dots2 fast...', frames: 'dots2', intervalMs: 50, color: ui.colors.yellow }).start();
  await sleep(500);
  sp2.succeed('Dots2 done');

  // 3) Line with prefix/suffix and custom success icon/color
  const sp3 = ui.spinner({ text: 'Line with prefix/suffix', frames: 'line', prefix: '[', suffix: ']', succeedIcon: '★', succeedColor: ui.colors.green }).start();
  await sleep(500);
  sp3.succeed('Line done');

  // 4) Arrow preset, runtime update to pipe + magenta
  const sp4 = ui.spinner({ text: 'Arrow then pipe...', frames: 'arrow', color: ui.colors.cyan }).start();
  await sleep(400);
  sp4.setFrames('pipe').setColor(ui.colors.magenta).setText('Now pipe (magenta)...');
  await sleep(400);
  sp4.succeed('Updated done');

  // 5) Earth preset, fail with red icon
  const sp5 = ui.spinner({ text: 'Earth spinning...', frames: 'earth' }).start();
  await sleep(500);
  sp5.fail('Something went wrong');

  // 6) Custom frames + clock + interval change
  const sp6 = ui.spinner({ text: 'Custom frames...', frames: ['·', '•', '●', '•'], color: ui.colors.blue }).start();
  await sleep(400);
  sp6.setFrames('clock').setInterval(120).setText('Clock preset now...');
  await sleep(600);
  sp6.succeed('Custom done');
}

demo();


