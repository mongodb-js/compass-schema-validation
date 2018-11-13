import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import ValidationEditor from 'components/validation-editor';

import styles from './compass-schema-validation.less';

import {
  validatorChanged,
  validatorCanceled,
  validatorSaved
} from 'modules/validation';
import { namespaceChanged } from 'modules/namespace';

/**
 * The core schema validation component.
 */
class CompassSchemaValidation extends Component {
  static displayName = 'CompassSchemaValidation';

  render() {
    return (
      <div className={classnames(styles.root)}>
        <ValidationEditor {...this.props} />
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => {
  return {
    serverVersion: state.serverVersion,
    validation: state.validation,
    fields: state.fields,
    namespace: state.namespace
  };
};

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCompassSchemaValidation = connect(
  mapStateToProps,
  {
    validatorChanged,
    validatorCanceled,
    validatorSaved,
    namespaceChanged
  },
)(CompassSchemaValidation);

export default MappedCompassSchemaValidation;
export {CompassSchemaValidation};
