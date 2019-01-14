import reducer, {
  zeroStateChanged,
  ZERO_STATE_CHANGED
} from 'modules/zero-state';

describe('zero-state module', () => {
  describe('#zeroStateChanged', () => {
    it('returns the ZERO_STATE_CHANGED action', () => {
      expect(zeroStateChanged()).to.deep.equal({
        type: ZERO_STATE_CHANGED,
        isZeroState: false
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not presented in zero-state module', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is zeroStateChanged', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, zeroStateChanged())).to.equal(false);
      });
    });
  });
});
