import { getMixAvailability } from './mix-compatibility';

describe('mix compatibility', () => {
  it('rejects the primary sound as its own layer', () => {
    expect(getMixAvailability('gentle-rain', 'gentle-rain').allowed).toBe(false);
    expect(getMixAvailability('guitar', 'guitar').allowed).toBe(false);
  });

  it('rejects rain already embedded in Rain & Thunder', () => {
    expect(getMixAvailability('thunder', 'gentle-rain').allowed).toBe(false);
  });

  it('rejects both bird recordings from either forest atmosphere', () => {
    expect(getMixAvailability('forest', 'forest').allowed).toBe(false);
    expect(getMixAvailability('forest', 'forest-morning').allowed).toBe(false);
    expect(getMixAvailability('forest-morning', 'forest').allowed).toBe(false);
    expect(getMixAvailability('forest-morning', 'forest-morning').allowed).toBe(false);
  });

  it('rejects guitar already embedded in Acoustic Guitar', () => {
    expect(getMixAvailability('guitar-acoustic', 'guitar').allowed).toBe(false);
  });

  it('allows unrelated sounds', () => {
    expect(getMixAvailability('thunder', 'flute').allowed).toBe(true);
    expect(getMixAvailability('guitar-acoustic', 'wind').allowed).toBe(true);
  });
});
