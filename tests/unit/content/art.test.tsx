import { render, screen } from '@testing-library/react';
import { ArtView } from '../../../src/content/ArtView';
import { Face, type Mood } from '../../../src/content/Face';
import { SleepingSeed } from '../../../src/content/common/SleepingSeed';
import { WiltedPlant } from '../../../src/content/common/WiltedPlant';

const inSvg = (node: React.ReactNode) => render(<svg>{node}</svg>);

describe('art foundation', () => {
  it.each(['normal', 'smile', 'talk', 'sleep', 'sad'] as Mood[])('Face vẽ được mood %s', (mood) => {
    inSvg(<Face mood={mood} x={100} y={100} scale={1} />);
    expect(screen.getByTestId('face')).toHaveAttribute('data-mood', mood);
  });

  it('ArtView vẽ ảnh PNG', () => {
    const { container } = inSvg(<ArtView art={{ image: '/plants/x.png' }} />);
    expect(container.querySelector('image')).toHaveAttribute('href', '/plants/x.png');
  });

  it('ArtView vẽ component SVG', () => {
    inSvg(<ArtView art={{ svg: () => <circle data-testid="dot" r={1} /> }} />);
    expect(screen.getByTestId('dot')).toBeInTheDocument();
  });

  it('hạt ngủ ôm gối và cây héo', () => {
    inSvg(<><SleepingSeed /><WiltedPlant /></>);
    expect(screen.getByTestId('sleeping-seed')).toBeInTheDocument();
    expect(screen.getByTestId('wilted-plant')).toBeInTheDocument();
  });
});
