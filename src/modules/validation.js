const bson = require('bson');
const Context = require('context-eval');
const EJSON = require('mongodb-extended-json');
const javascriptStringify = require('javascript-stringify');

import { defaults } from 'lodash';

/**
 * The module action prefix.
 */
const PREFIX = 'validation';

/**
 * Validator changed action name.
 */
export const VALIDATOR_CHANGED = `${PREFIX}/VALIDATOR_CHANGED`;

/**
 * Validator canceled action name.
 */
export const VALIDATOR_CANCELED = `${PREFIX}/VALIDATOR_CANCELED`;

/**
 * Validator saved action name.
 */
export const VALIDATOR_SAVED = `${PREFIX}/VALIDATOR_SAVED`;

/**
 * Validator created action name.
 */
export const VALIDATOR_CREATED = `${PREFIX}/VALIDATOR_CREATED`;

/**
 * Validation action changed action name.
 */
export const VALIDATION_ACTION_CHANGED = `${PREFIX}/VALIDATION_ACTION_CHANGED`;

/**
 * Validation level changed action name.
 */
export const VALIDATION_LEVEL_CHANGED = `${PREFIX}/VALIDATION_LEVEL_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  validator: '',
  validationAction: 'warning',
  validationLevel: 'moderate',
  isChanged: false,
  syntaxError: null
};

/**
 * Create the sandbox object with BSON types support.
 *
 * @returns {Object} The sandbox object.
 */
function getQuerySandbox() {
  return {
    RegExp: RegExp,
    Binary: bson.Binary,
    Code: function(c, s) {
      return new bson.Code(c, s);
    },
    DBRef: bson.DBRef,
    Decimal128: bson.Decimal128,
    NumberDecimal: bson.Decimal128.fromString,
    Double: bson.Double,
    Int32: bson.Int32,
    NumberInt: (s) => parseInt(s, 10),
    Long: bson.Long,
    NumberLong: bson.Long.fromNumber,
    Int64: bson.Long,
    Map: bson.Map,
    MaxKey: bson.MaxKey,
    MinKey: bson.MinKey,
    ObjectID: bson.ObjectID,
    ObjectId: bson.ObjectID,
    Symbol: bson.Symbol,
    Timestamp: function(low, high) {
      return new bson.Timestamp(low, high);
    },
    ISODate: function(s) {
      return new Date(s);
    },
    Date: function(s) {
      return new Date(s);
    }
  };
}

/**
 * Execute JS to parse the query string.
 *
 * @param {String} input - Validation rules.
 * @param {Object} sandbox - The sandbox object.
 *
 * @returns {Object} The parsed query.
 */
function executeJavascript(input, sandbox) {
  sandbox = sandbox || {};
  sandbox.__result = {};

  const ctx = new Context(sandbox);
  const res = ctx.evaluate('__result = ' + input);

  ctx.destroy();

  return res;
}

/**
 * Check validator as a simple query.
 *
 * @param {String} validator - Validator.
 *
 * @returns {Boolean} Is validator correct.
 */
const checkValidator = (validator) => {
  const sandbox = getQuerySandbox();
  const validation = { syntaxError: null, validator };

  try {
    validation.validator = executeJavascript(validator, sandbox);
  } catch (error) {
    validation.syntaxError = error;
  }

  return validation;
};

/**
 * Change validator.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeValidator = (state, action) => {
  const validation = checkValidator(action.validator);

  return {
    ...state,
    isChanged: true,
    validator: action.validator,
    syntaxError: validation.syntaxError
  };
};

/**
 * Cancel validator changes.
 *
 * @param {Object} state - The state
 *
 * @returns {Object} The new state.
 */
const cancelValidator = (state) => ({
  ...state,
  isChanged: false,
  validator: state.prevValidator,
  syntaxError: null
});

/**
 * Update validator according to saved changes changes.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const updateValidator = (state, action) => {
  const newState = {
    ...state,
    isChanged: false,
    validator: action.validator,
    syntaxError: null
  };

  return newState;
};

/**
 * Create validator changes.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const createValidator = (state, action) => {
  const validation = checkValidator(action.validator);
  const validator = javascriptStringify(validation.validator, null, 2);

  return {
    ...state,
    isChanged: false,
    prevValidator: validator,
    validator: validator,
    syntaxError: null
  };
};

/**
 * Change validation action.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeValidationAction = (state, action) => ({
  ...state,
  validationAction: action.validationAction
});

/**
 * Change validation level.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeValidationLevel = (state, action) => ({
  ...state,
  validationLevel: action.validationLevel
});

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {
  [VALIDATOR_CHANGED]: changeValidator,
  [VALIDATOR_CANCELED]: cancelValidator,
  [VALIDATOR_CREATED]: createValidator,
  [VALIDATOR_SAVED]: updateValidator,
  [VALIDATION_ACTION_CHANGED]: changeValidationAction,
  [VALIDATION_LEVEL_CHANGED]: changeValidationLevel
};

/**
 * Reducer function for handle state changes to status.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  const fn = MAPPINGS[action.type];

  return fn ? fn(state, action) : state;
}

/**
 * Action creator for validation action changed events.
 *
 * @param {String} validationAction - Validation action.
 *
 * @returns {Object} Validation action changed action.
 */
export const validationActionChanged = (validationAction) => ({
  type: VALIDATION_ACTION_CHANGED,
  validationAction
});

/**
 * Action creator for validation level changed events.
 *
 * @param {String} validationLevel - Validation level.
 *
 * @returns {Object} Validation level changed action.
 */
export const validationLevelChanged = (validationLevel) => ({
  type: VALIDATION_LEVEL_CHANGED,
  validationLevel
});

/**
 * Action creator for validator changed events.
 *
 * @param {String} validator - Validator.
 *
 * @returns {Object} Validator changed action.
 */
export const validatorChanged = (validator) => ({
  type: VALIDATOR_CHANGED,
  validator
});

/**
 * Action creator for validator created events.
 *
 * @param {String} validator - Validator.
 *
 * @returns {Object} Validator created action.
 */
export const validatorCreated = (validator) => ({
  type: VALIDATOR_CREATED,
  validator
});

/**
 * Action creator for validator canceled events.
 *
 * @returns {Object} Validator canceled action.
 */
export const validatorCanceled = () => ({
  type: VALIDATOR_CANCELED
});

/**
 * Action creator for validator saved events.
 *
 * @param {String} validator - Validator.
 *
 * @returns {Object} Validator saved action.
 */
export const validatorSaved = (validator) => ({
  type: VALIDATOR_SAVED,
  validator
});

/**
 * Fetch validation.
 *
 * @param {Object} namespace - Namespace.
 *
 * @returns {Function} The function.
 */
export const fetchValidation = (namespace) => {
  return (dispatch, getState) => {
    const state = getState();
    const dataService = state.dataService.dataService;

    if (dataService) {
      dataService.listCollections(
        namespace.database,
        { name: namespace.collection },
        (error, data) => {
          const options = data[0].options;
          let validation = {
            validator: INITIAL_STATE.validator,
            validationAction: INITIAL_STATE.validationAction,
            validationLevel: INITIAL_STATE.validationLevel
          };

          if (!error && options) {
            validation = defaults(
              {
                validator: options.validator,
                validationAction: options.validationAction,
                validationLevel: options.validationLevel
              },
              validation
            );
          }

          dispatch(validatorCreated(EJSON.stringify(validation.validator, null, 2)));
          dispatch(validationActionChanged(validation.validationAction));
          dispatch(validationLevelChanged(validation.validationLevel));

          return;
        }
      );
    }
  };
};

/**
 * Save validation.
 *
 * @param {Object} validator - Validator.
 *
 * @returns {Function} The function.
 */
export const saveValidation = (validator) => {
  return (dispatch, getState) => {
    const state = getState();
    const dataService = state.dataService.dataService;
    const namespace = state.namespace;
    const validation = checkValidator(validator);

    if (dataService) {
      dataService.command(
        namespace.database,
        {
          collMod: namespace.collection,
          validator: validation.validator,
          validationLevel: 'moderate'
        },
        (error, data) => {
          console.log('error----------------------');
          console.log(error);
          console.log('----------------------');
          console.log('data----------------------');
          console.log(data);
          console.log('----------------------');

          return dispatch(validatorSaved(validator));
        }
      );
    }
  };
};
