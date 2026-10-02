import { stageFor, stageIndex, stageOfTodos } from '../../../src/domain/growth';

describe('growth', () => {
  it.each([
    [0, 0, 'seed'],
    [0, 3, 'seed'],
    [1, 3, 'sprout'],
    [1, 2, 'bud'],
    [2, 3, 'bud'],
    [3, 3, 'bloom'],
    [1, 1, 'bloom'],
  ] as const)('%i/%i → %s', (done, total, expected) => {
    expect(stageFor(done, total)).toBe(expected);
  });

  it('stageOfTodos đếm việc đã xong', () => {
    expect(stageOfTodos([{ done: true }, { done: false }])).toBe('bud');
  });

  it('stageIndex theo thứ tự lớn lên', () => {
    expect(stageIndex('seed')).toBeLessThan(stageIndex('sprout'));
    expect(stageIndex('sprout')).toBeLessThan(stageIndex('bud'));
    expect(stageIndex('bud')).toBeLessThan(stageIndex('bloom'));
  });
});
