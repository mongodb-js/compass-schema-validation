import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { pick } from 'lodash';
import PropTypes from 'prop-types';
import { ZeroState, StatusRow } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import ValidationEditor from 'components/validation-editor';
import SampleDocuments from 'components/sample-documents';
import { ZeroGraphic } from 'components/zero-graphic';
import {
  validatorChanged,
  cancelValidation,
  saveValidation,
  validationActionChanged,
  validationLevelChanged
} from 'modules/validation';
import { namespaceChanged } from 'modules/namespace';
import { openLink } from 'modules/link';
import { fetchSampleDocuments } from 'modules/sample-documents';
import { changeZeroState, zeroStateChanged } from 'modules/zero-state';
import semver from 'semver';

import styles from './compass-schema-validation.less';

/**
 * The lowest supported version.
 */
const MIN_VERSION = '3.2.0';

/**
 * Read only warning for the banner.
 */
const READ_ONLY_WARNING = 'Schema validation on readonly views are not supported.';

/**
 * Version warning for the banner.
 */
const VERSION_WARNING = 'Compass no longer supports the visual rule builder for server versions below 3.2. To use the visual rule builder, please';

/**
 * Header for zero state.
 */
const HEADER = 'Add validation rules';

/**
 * Additional text for zero state.
 */
const SUBTEXT = 'Create rules to enforce data structure of documents on updates and inserts.';

/**
 * Link to the schema validation documentation.
 */
const DOC_SCHEMA_VALIDATION = 'https://docs.mongodb.com/manual/core/schema-validation/';

/**
 * Link to the upgrading to the latest revision documentation.
 */
const DOC_UPGRADE_REVISION = 'https://docs.mongodb.com/manual/tutorial/upgrade-revision/';

/**
 * The core schema validation component.
 */
class CompassSchemaValidation extends Component {
  static displayName = 'CompassSchemaValidation';

  static propTypes = {
    isZeroState: PropTypes.bool.isRequired,
    changeZeroState: PropTypes.func.isRequired,
    zeroStateChanged: PropTypes.func.isRequired,
    isEditable: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired
  }

  /**
   * Checks if it is a proper server version.
   *
   * @returns {Boolean}
   */
  isProperServerVersion() {
    return semver.gte(this.props.serverVersion, MIN_VERSION);
  }

  /**
   * Checks if the zero state window should be displayed.
   *
   * @returns {Boolean}
   */
  checkIfZeroState() {
    return (this.props.isZeroState || !this.props.isEditable);
  }

  /**
   * Renders the banner if the validatiion is not editable.
   *
   * @returns {React.Component} The component.
   */
  renderBanner() {
    if (!this.props.isEditable) {
      if (this.isProperServerVersion()) {
        return (<StatusRow style="warning">{READ_ONLY_WARNING}</StatusRow>);
      }

      return (
        <StatusRow style="warning">
          {VERSION_WARNING}
          <div>&nbsp;</div>
          <a
            className={classnames(styles['upgrade-link'])}
            onClick={this.props.openLink.bind(this, DOC_UPGRADE_REVISION)}
          >
            upgrade to MongoDB 3.2.
          </a>
        </StatusRow>
      );
    }
  }

  /**
   * Render the schema validation component zero state.
   *
   * @returns {React.Component} The component.
   */
  renderZeroState() {
    if (this.checkIfZeroState()) {
      return (
          <div className={classnames(styles['zero-state-container'])}>
            <ZeroGraphic />
            <ZeroState header={HEADER} subtext={SUBTEXT}>
              <div className={classnames(styles['zero-state-action'])}>
                <div>
                  <TextButton
                    className={`btn btn-primary btn-lg ${
                      !this.props.isEditable ? 'disabled' : ''
                    }`}
                    text="Add Rule"
                    clickHandler={this.props.changeZeroState} />
                </div>
                <a
                  className={classnames(styles['zero-state-link'])}
                  onClick={this.props.openLink.bind(this, DOC_SCHEMA_VALIDATION)}
                >
                  Learn more about validations
                </a>
              </div>
            </ZeroState>
        </div>
      );
    }
  }

  /**
   * Render the schema validation component content.
   *
   * @returns {React.Component} The component.
   */
  renderContent() {
    if (!this.checkIfZeroState()) {
      return (
        <div className={classnames(styles['content-container'])}>
          <ValidationEditor {...this.props} />
          <SampleDocuments {...this.props} />
        </div>
      );
    }
  }

  /**
   * Render the schema validation component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles.root)}>
        {this.renderBanner()}
        {this.renderZeroState()}
        {this.renderContent()}
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
  [
    'serverVersion',
    'validation',
    'fields',
    'namespace',
    'sampleDocuments',
    'isZeroState',
    'isEditable'
  ]
);

/**
 * Connect the redux store to the component (dispatch).
 */
const MappedCompassSchemaValidation = connect(
  mapStateToProps,
  {
    fetchSampleDocuments,
    validatorChanged,
    cancelValidation,
    saveValidation,
    namespaceChanged,
    validationActionChanged,
    validationLevelChanged,
    openLink,
    zeroStateChanged,
    changeZeroState
  },
)(CompassSchemaValidation);

export default MappedCompassSchemaValidation;
export {CompassSchemaValidation};
