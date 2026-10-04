import { MAX_ANIMATED_BG_BYTES, prepareBackground } from '../../../src/utils/image';

const file = (bytes: number[], type: string, name: string) => new File([new Uint8Array(bytes)], name, { type });

describe('prepareBackground (ảnh nền Lịch)', () => {
  it('GIF giữ nguyên từng byte để còn chuyển động (không nén qua canvas)', async () => {
    const bg = await prepareBackground(file([71, 73, 70, 56, 57, 97, 1, 2], 'image/gif', 'meo.gif'));
    expect(bg.mime).toBe('image/gif');
    expect([...new Uint8Array(bg.data)]).toEqual([71, 73, 70, 56, 57, 97, 1, 2]);
  });

  it('video (mp4, mov của iPhone) giữ nguyên tệp và loại', async () => {
    for (const [type, name] of [['video/mp4', 'a.mp4'], ['video/quicktime', 'IMG_0001.MOV']]) {
      const bg = await prepareBackground(file([0, 0, 0, 24, 102, 116, 121, 112], type, name));
      expect(bg.mime).toBe(type);
      expect(bg.data.byteLength).toBe(8);
    }
  });

  it('tệp không ghi loại nhưng đuôi là .mov/.mp4/.gif vẫn nhận đúng', async () => {
    expect((await prepareBackground(file([1], '', 'clip.MOV'))).mime).toBe('video/quicktime');
    expect((await prepareBackground(file([1], '', 'clip.mp4'))).mime).toBe('video/mp4');
    expect((await prepareBackground(file([1], '', 'meo.gif'))).mime).toBe('image/gif');
  });

  it('ảnh động / video quá lớn thì báo lỗi tiếng Việt, không lưu', async () => {
    const big = new File([new Uint8Array(MAX_ANIMATED_BG_BYTES + 1)], 'dai.mp4', { type: 'video/mp4' });
    await expect(prepareBackground(big)).rejects.toThrow(/quá lớn.*25 MB/);
  });
});
