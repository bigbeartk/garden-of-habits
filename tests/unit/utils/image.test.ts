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

  it('nhận ra GIF / video theo nội dung tệp dù điện thoại ghi sai loại hoặc tên không có đuôi', async () => {
    const gif = [71, 73, 70, 56, 57, 97, 1, 2];
    // Android: tên kiểu "1000012345", loại trống hoặc ghi chung chung
    expect((await prepareBackground(file(gif, '', '1000012345'))).mime).toBe('image/gif');
    expect((await prepareBackground(file(gif, 'image/jpeg', 'image.jpg'))).mime).toBe('image/gif');
    expect((await prepareBackground(file(gif, 'application/octet-stream', 'x'))).mime).toBe('image/gif');
    const mp4 = [0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109];
    expect((await prepareBackground(file(mp4, '', '1000012346'))).mime).toBe('video/mp4');
    const mov = [0, 0, 0, 20, 102, 116, 121, 112, 113, 116, 32, 32];
    expect((await prepareBackground(file(mov, '', 'x'))).mime).toBe('video/quicktime');
    const webm = [0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0];
    expect((await prepareBackground(file(webm, '', 'x'))).mime).toBe('video/webm');
  });

  it('ảnh động / video quá lớn thì báo lỗi tiếng Việt, không lưu', async () => {
    const big = new File([new Uint8Array(MAX_ANIMATED_BG_BYTES + 1)], 'dai.mp4', { type: 'video/mp4' });
    await expect(prepareBackground(big)).rejects.toThrow(/quá lớn.*25 MB/);
  });
});
