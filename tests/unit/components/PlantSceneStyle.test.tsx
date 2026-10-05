import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PlantScene } from '../../../src/components/PlantScene';
import { MiniPlant } from '../../../src/components/MiniPlant';
import { makeDay } from '../helpers';

// loài giả có một dáng, để test không phụ thuộc hình vẽ thật
vi.mock('../../../src/content/plants/registry', async (orig) => {
  const real = await orig<typeof import('../../../src/content/plants/registry')>();
  const Mark = (id: string) => () => <rect data-testid={`art-${id}`} />;
  const anchor = { x: 1, y: 1, scale: 1 };
  const fake = {
    ...real.PLANTS[0],
    id: 'fake',
    stages: { seed: { svg: Mark('seed') }, sprout: { svg: Mark('sprout') }, bud: { svg: Mark('bud') }, bloom: { svg: Mark('bloom') } },
    styles: [{ id: 'tall', name: 'Cao', unlockAt: 10, stages: { bud: { svg: Mark('tall-bud') }, bloom: { svg: Mark('tall-bloom') } }, faceAnchor: { bud: anchor, bloom: anchor } }],
  };
  return { ...real, getSpecies: (id: string) => (id === 'fake' ? fake : real.getSpecies(id)) };
});

describe('PlantScene với dáng', () => {
  it('vẽ hình của dáng và ghi data-style', () => {
    render(<PlantScene plantId="fake" potId="terracotta" stage="bloom" specialId={null} styleId="tall" mood="smile" />);
    expect(screen.getByTestId('art-tall-bloom')).toBeInTheDocument();
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-style', 'tall');
  });

  it('dáng lạ hoặc không có → Gốc', () => {
    render(<PlantScene plantId="fake" potId="terracotta" stage="bloom" specialId={null} styleId="nope" mood="smile" />);
    expect(screen.getByTestId('art-bloom')).toBeInTheDocument();
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-style', 'base');
  });

  it('seed/sprout luôn hình Gốc', () => {
    render(<PlantScene plantId="fake" potId="terracotta" stage="sprout" specialId={null} styleId="tall" mood="smile" />);
    expect(screen.getByTestId('art-sprout')).toBeInTheDocument();
  });

  it('ô lịch vẽ theo dáng đã lưu của ngày', () => {
    render(<MiniPlant status="plant" record={makeDay({ date: '2026-09-01', plantId: 'fake', finalStage: 'bloom', styleId: 'tall' })} />);
    expect(screen.getByTestId('art-tall-bloom')).toBeInTheDocument();
  });
});
