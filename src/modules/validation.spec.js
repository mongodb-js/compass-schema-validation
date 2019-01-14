import javascriptStringify from 'javascript-stringify';
import reducer, {
  checkValidator,
  validationActionChanged,
  validationLevelChanged,
  validatorChanged,
  validationFetched,
  validationCanceled,
  validationSaved,
  validationSaveFailed,
  VALIDATOR_CHANGED,
  VALIDATION_CANCELED,
  VALIDATION_SAVED,
  VALIDATION_SAVE_FAILED,
  VALIDATION_FETCHED,
  VALIDATION_ACTION_CHANGED,
  VALIDATION_LEVEL_CHANGED
} from 'modules/validation';

describe('validation module', () => {
  describe('#checkValidator', () => {
    it('returns parsed JS validation query and error information', () => {
      expect(checkValidator('{ $jsonSchema: { bsonType: \'object\' } }')).to.deep.equal({
        syntaxError: null,
        validator: { $jsonSchema: { bsonType: 'object' } }
      });
    });
  });

  describe('#validationActionChanged', () => {
    it('returns the VALIDATION_ACTION_CHANGED action', () => {
      expect(validationActionChanged('warn')).to.deep.equal({
        type: VALIDATION_ACTION_CHANGED,
        validationAction: 'warn'
      });
    });
  });

  describe('#validationLevelChanged', () => {
    it('returns the VALIDATION_LEVEL_CHANGED action', () => {
      expect(validationLevelChanged('moderate')).to.deep.equal({
        type: VALIDATION_LEVEL_CHANGED,
        validationLevel: 'moderate'
      });
    });
  });

  describe('#validatorChanged', () => {
    it('returns the VALIDATOR_CHANGED action', () => {
      expect(
        validatorChanged('{ $jsonSchema: { bsonType: \'object\', required: [ \'name\' ] } }')
      ).to.deep.equal({
        type: VALIDATOR_CHANGED,
        validator: '{ $jsonSchema: { bsonType: \'object\', required: [ \'name\' ] } }'
      });
    });
  });

  describe('#validationFetched', () => {
    it('returns the VALIDATION_FETCHED action', () => {
      expect(validationFetched({
        validator: { name: { $exists: true } },
        validationAction: 'warning',
        validationLevel: 'off'
      })).to.deep.equal({
        type: VALIDATION_FETCHED,
        validation: {
          validator: { name: { $exists: true } },
          validationAction: 'warning',
          validationLevel: 'off'
        }
      });
    });
  });

  describe('#validationCanceled', () => {
    it('returns the VALIDATION_CANCELED action', () => {
      expect(validationCanceled()).to.deep.equal({
        type: VALIDATION_CANCELED
      });
    });
  });

  describe('#validationSaved', () => {
    it('returns the VALIDATION_SAVED action', () => {
      const validation = validationSaved();

      expect(validation.type).to.equal(VALIDATION_SAVED);
      expect(validation.isChanged).to.equal(false);
    });
  });

  describe('#validationSaveFailed', () => {
    it('returns the VALIDATION_SAVE_FAILED action', () => {
      expect(validationSaveFailed({ message: 'Error!' })).to.deep.equal({
        type: VALIDATION_SAVE_FAILED,
        isChanged: true,
        error: { message: 'Error!' }
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not presented in validation module', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          validator: '',
          validationAction: 'error',
          validationLevel: 'strict',
          isChanged: false,
          syntaxError: null,
          error: null,
          isEditable: true
        });
      });
    });

    context('when the action is validationActionChanged', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, validationActionChanged('warn'));

        expect(validation.validationAction).to.equal('warn');
      });
    });

    context('when the action is validationLevelChanged', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, validationLevelChanged('moderate'));

        expect(validation.validationLevel).to.equal('moderate');
      });
    });

    context('when the action is validatorChanged', () => {
      it('returns the new state for the simple object', () => {
        const validation = reducer(undefined, validatorChanged(`{
          $jsonSchema: { bsonType: 'object', required: [ 'name' ] }
        }`));

        expect(validation.validator).to.equal(`{
          $jsonSchema: { bsonType: 'object', required: [ 'name' ] }
        }`);
      });

      it('returns the new state for the object with regex', () => {
        const validation = reducer(undefined, validatorChanged(`{
          'name': 'test',
          'options': {
            'validator': {
              'number': {
                '$exists': true
              },
              'last_name': {
                '$regex': '^foo'
              }
            },
            'validationLevel': 'strict',
            'validationAction': 'error'
          }
        }`));

        expect(validation.validator).to.equal(`{
          'name': 'test',
          'options': {
            'validator': {
              'number': {
                '$exists': true
              },
              'last_name': {
                '$regex': '^foo'
              }
            },
            'validationLevel': 'strict',
            'validationAction': 'error'
          }
        }`);
      });
    });

    context('when the action is validationFetched', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, validationFetched({
          validator: { name: { $exists: true } },
          validationAction: 'warning',
          validationLevel: 'off'
        }));
        const checkedValidator = checkValidator('{ name: { $exists: true } }');
        const validator = javascriptStringify(checkedValidator.validator, null, 2);

        expect(validation).to.deep.equal({
          isChanged: false,
          prevValidation: {
            validator,
            validationAction: 'warning',
            validationLevel: 'off'
          },
          validator,
          validationAction: 'warning',
          validationLevel: 'off',
          syntaxError: null,
          error: null,
          isEditable: true
        });
      });
    });

    context('when the action is validationSaved', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, validationSaved());

        expect(validation).to.deep.equal({
          validator: '',
          validationAction: 'error',
          validationLevel: 'strict',
          isChanged: false,
          syntaxError: null,
          error: null,
          isEditable: true
        });
      });
    });

    context('when the action is validationSaveFailed', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, validationSaveFailed({ message: 'Error!' }));

        expect(validation).to.deep.equal({
          validator: '',
          validationAction: 'error',
          validationLevel: 'strict',
          isChanged: true,
          syntaxError: null,
          error: { message: 'Error!' },
          isEditable: true
        });
      });
    });
  });
});
