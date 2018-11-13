const bson = require('bson');
const Context = require('context-eval');
const EJSON = require('mongodb-extended-json');
const queryLanguage = require('mongodb-language-model');

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
 * The initial state.
 */
export const INITIAL_STATE = {
  validator: '',
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
  const validation = {validator, syntaxError: null};
  const sandbox = getQuerySandbox();

  try {
    validation.validator = EJSON.stringify(executeJavascript(validator, sandbox));
    validation.syntaxError = queryLanguage.accepts(validation.validator)
      ? null
      : 'MongoDB language model does not accept the input';
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
  const newState = {...state};
  const validation = checkValidator(action.validator);

  newState.isChanged = true;
  newState.validator = validation.validator;
  newState.syntaxError = validation.syntaxError;

  return newState;
};

/**
 * Cancel validator changes.
 *
 * @param {Object} state - The state
 *
 * @returns {Object} The new state.
 */
const cancelValidator = (state) => {
  const newState = {...state};

  newState.isChanged = false;
  newState.validator = ''; // TODO: Read validation from the collection to get old values.
  newState.syntaxError = null;

  return newState;
};

/**
 * Save validator changes.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const saveValidator = (state, action) => {
  const newState = {...state};

  newState.isChanged = false;
  newState.validator = action.validator;
  newState.syntaxError = null;

  // TODO: Save validation to the collection.

  return newState;
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {};

MAPPINGS[VALIDATOR_CHANGED] = changeValidator;
MAPPINGS[VALIDATOR_CANCELED] = cancelValidator;
MAPPINGS[VALIDATOR_SAVED] = saveValidator;

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
 * Action creator for validation fetched events.
 *
 * @param {String} validator - Validator.
 *
 * @returns {Object} Validator saved action.
 */
export const validationFetched = (validator) => ({
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
      dataService.listCollections(namespace.database, {name: namespace.collection}, (error, data) => {
        const options = data[0].options;

        if (error || !options) {
          // An error occured during fetch, e.g. missing permissions.
          // TODO: dispatch(setError());
          return;
        }

        // TODO: Set validation to props;
      });
    }
  };
};
