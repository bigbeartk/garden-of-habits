import { render, screen } from '@testing-library/react';
import { PlantScene } from '../../../src/components/PlantScene';
import { SkyBackground } from '../../../src/components/SkyBackground';

describe('PlantScene', () => {
  it('ghi các thuộc tính dữ liệu và vẽ mặt theo mood', () => {
    render(<PlantScene plantId="corn" potId="rattan" stage="bud" specialId={null} mood="smile" />);
    const scene = screen.getByTestId('plant-scene');
    expect(scene).toHaveAttribute('data-plant', 'corn');
    expect(scene).toHaveAttribute('data-pot', 'rattan');
    expect(scene).toHaveAttribute('data-stage', 'bud');
    expect(scene).toHaveAttribute('data-mode', 'plant');
    expect(screen.getByTestId('face')).toHaveAttribute('data-mood', 'smile');
  });

  it('id lạ thì dùng cây/chậu mặc định, không bị lỗi', () => {
    render(<PlantScene plantId="banana" potId="golden" stage="bloom" specialId="unknown" mood="normal" />);
    const scene = screen.getByTestId('plant-scene');
    expect(scene).toHaveAttribute('data-plant', 'sunflower');
    expect(scene).toHaveAttribute('data-pot', 'terracotta');
    expect(scene).toHaveAttribute('data-special', '');
  });

  it('hiệu ứng đặc biệt được vẽ', () => {
    render(<PlantScene plantId="cherry" potId="polka" stage="bloom" specialId="glow" mood="normal" />);
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-special', 'glow');
    expect(screen.getByTestId('special-glow')).toBeInTheDocument();
  });

  it('chế độ ngủ và héo', () => {
    const { rerender } = render(<PlantScene plantId="corn" potId="rattan" stage="bloom" specialId="glow" mood="sleep" mode="sleeping" />);
    expect(screen.getByTestId('sleeping-seed')).toBeInTheDocument();
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-special', '');
    rerender(<PlantScene plantId="" potId="terracotta" stage="seed" specialId={null} mood="sad" mode="wilted" />);
    expect(screen.getByTestId('wilted-plant')).toBeInTheDocument();
  });

  it('SkyBackground theo buổi', () => {
    render(<SkyBackground time="evening"><span>x</span></SkyBackground>);
    expect(screen.getByTestId('sky')).toHaveAttribute('data-time', 'evening');
  });
});
