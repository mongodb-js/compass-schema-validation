import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { pick } from 'lodash';
import ValidationEditor from 'components/validation-editor';
import SampleDocuments from 'components/sample-documents';
import {
  validatorChanged,
  validationCanceled,
  saveValidation,
  validationActionChanged,
  validationLevelChanged
} from 'modules/validation';
import { namespaceChanged } from 'modules/namespace';
import { openLink } from 'modules/link';
import { fetchSampleDocuments } from 'modules/sample-documents';

import styles from './compass-schema-validation.less';

/**
 * The core schema validation component.
 */
class CompassSchemaValidation extends Component {
  static displayName = 'CompassSchemaValidation';

  render() {
    return (
      <div className={classnames(styles.root)}>
        <ValidationEditor {...this.props} />
        <SampleDocuments {...this.props} />
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
const mapStateToProps = (state) => pick(
  state,
  ['serverVersion', 'validation', 'fields', 'namespace', 'sampleDocuments']
);

/**
 * Connect the redux store to the component (dispatch).
 */
const MappedCompassSchemaValidation = connect(
  mapStateToProps,
  {
    fetchSampleDocuments,
    validatorChanged,
    validationCanceled,
    saveValidation,
    namespaceChanged,
    validationActionChanged,
    validationLevelChanged,
    openLink
  },
)(CompassSchemaValidation);

export default MappedCompassSchemaValidation;
export {CompassSchemaValidation};
