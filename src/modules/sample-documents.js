import { checkValidator, syntaxErrorOccurred } from './validation';

/**
 * Sample documents fetched action.
 */
export const SAMPLE_DOCUMENTS_FETCHED = 'validation/namespace/SAMPLE_DOCUMENTS_FETCHED';

/**
 * Loading sample documents aciton name.
 */
export const LOADING_SAMPLE_DOCUMENTS = 'validation/namespace/LOADING_SAMPLE_DOCUMENTS';

/**
 * The initial state.
 */
export const INITIAL_STATE = { matching: null, notmatching: null, isLoading: false };

/**
 * Collection max limit.
 */
const MAX_LIMIT = 100000;

/**
 * Refresh sample document.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const refreshSampleDocuments = (state, action) => ({
  ...state,
  matching: action.matching,
  notmatching: action.notmatching,
  isLoading: false
});

/**
 * Action creator for sample documents changed events.
 *
 * @param {Object} sampleDocuments - Sample documents.
 *
 * @returns {Object} Validation saved action.
 */
export const sampleDocumentsFetched = (sampleDocuments) => ({
  type: SAMPLE_DOCUMENTS_FETCHED,
  matching: sampleDocuments.matching,
  notmatching: sampleDocuments.notmatching
});

/**
 * Action creator for load sample documents events.
 *
 * @param {Object} state - The state
 *
 * @returns {Object} Validation saved action.
 */
const loadSampleDocuments = (state) => ({
  ...state,
  type: LOADING_SAMPLE_DOCUMENTS,
  isLoading: true
});

/**
 * The loading sample documents.
 *
 * @returns {Object} The action.
 */
export const loadingSampleDocuments = () => ({ type: LOADING_SAMPLE_DOCUMENTS });

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {};

MAPPINGS[SAMPLE_DOCUMENTS_FETCHED] = refreshSampleDocuments;
MAPPINGS[LOADING_SAMPLE_DOCUMENTS] = loadSampleDocuments;

/**
 * Returns zero documents.
 *
 * @param {Function} dispatch - Dispatch.
 * @param {Object} error - Error.
 */
const zeroDocuments = (dispatch, error) => {
  dispatch(syntaxErrorOccurred(error));
  dispatch(sampleDocumentsFetched({
    matching: null,
    notmatching: null
  }));
  return;
};

/**
 * Fetch sample documents.
 *
 * @param {Object} docsOptions - Collection of auxiliary options.
 * @param {Function} callback - Callback function that returns
 * matching or not mathing document.
 */
const getSampleDocuments = (docsOptions, callback) => {
  const aggOptions = { allowDiskUse: true };
  const pipeline = docsOptions.pipeline;

  if (docsOptions.count > MAX_LIMIT) {
    pipeline.unshift({ $limit: MAX_LIMIT });
  }

  docsOptions.dataService.aggregate(
    docsOptions.namespace,
    docsOptions.pipeline,
    aggOptions,
    (aggError, cursor) => {
      if (aggError) {
        return zeroDocuments(docsOptions.dispatch, aggError);
      }

      cursor.toArray((toArrayError, documents) => {
        if (toArrayError) {
          return zeroDocuments(docsOptions.dispatch, toArrayError);
        }

        cursor.close();

        return callback(documents);
      });
    }
  );
};

/**
 * Fetch sample documents.
 *
 * @param {Object} validator - Validator.
 *
 * @returns {Function} The function.
 */
export const fetchSampleDocuments = (validator) => {
  return (dispatch, getState) => {
    dispatch(loadingSampleDocuments());

    const state = getState();
    const dataService = state.dataService.dataService;
    const namespace = state.namespace.ns;
    const checkedValidator = checkValidator(validator);
    const query = checkValidator(checkedValidator.validator).validator;
    const pipeline = [{ $match: query }, { $limit: 1 }];

    if (dataService) {
      dataService.count(namespace, query, {}, (countError, count) => {
        if (countError) {
          return zeroDocuments(dispatch, countError);
        }

        const docsOptions = {
          pipeline,
          namespace,
          dispatch,
          dataService,
          count
        };

        getSampleDocuments(docsOptions, (matching) => {
          docsOptions.pipeline = [
            { $match: { '$nor': [ query ] } },
            { $limit: 1 }
          ];
          getSampleDocuments(docsOptions, (notmatching) => {
            return dispatch(sampleDocumentsFetched({
              matching: matching[0] ? matching[0] : null,
              notmatching: notmatching[0] ? notmatching[0] : null
            }));
          });
        });
      });
    }
  };
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
