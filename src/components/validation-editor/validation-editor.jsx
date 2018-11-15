import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import AceEditor from 'react-ace';
import ace from 'brace';
import { QueryAutoCompleter } from 'mongodb-ace-autocompleter';
import { TextButton } from 'hadron-react-buttons';

import styles from './validation-editor.less';

import 'brace/ext/language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

const tools = ace.acequire('ace/ext/language_tools');

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  enableLiveAutocompletion: true,
  tabSize: 2,
  fontSize: 11,
  minLines: 10,
  maxLines: Infinity,
  highlightActiveLine: false,
  showGutter: true,
  useWorker: false,
  showPrintMargin: false
};

/**
 * The validation editor component.
 */
class ValidationEditor extends Component {
  static displayName = 'ValidationEditor';

  static propTypes = {
    validatorChanged: PropTypes.func.isRequired,
    validatorCanceled: PropTypes.func.isRequired,
    validatorSaved: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired,
    fields: PropTypes.array,
    validation: PropTypes.shape({
      validator: PropTypes.string.isRequired,
      isChanged: PropTypes.bool.isRequired,
      syntaxError: PropTypes.object
    }),
    error: PropTypes.string
  };

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    const textCompleter = tools.textCompleter;

    this.completer = new QueryAutoCompleter(
      props.serverVersion,
      textCompleter,
      props.fields
    );
  }

  /**
   * Subscribe on mount.
   */
  componentDidMount() {
    this.unsubFields = global.hadronApp.appRegistry.getStore('Field.Store').listen((fields) => {
      this.completer.update(this.processFields(fields.fields));
    });
  }

  /**
   * Unsubscribe listeners.
   */
  componentWillUnmount() {
    this.unsubFields();
  }

  /**
   * Save validator changes.
   */
  onValidatorSave() {
    this.props.validatorSaved(this.props.validation.validator);
  }

  /**
   * Handles converting the field list to an ACE friendly format.
   *
   * @param {Object} fields - The fields.
   *
   * @returns {Array} The field list.
   */
  processFields = (fields) => {
    return Object.keys(fields).map((key) => {
      const field = (key.indexOf('.') > -1 || key.indexOf(' ') > -1) ? `"${key}"` : key;
      return {
        name: key,
        value: field,
        score: 1,
        meta: 'field',
        version: '0.0.0'
      };
    });
  }

  /**
   * Should the component update?
   *
   * @param {Object} nextProps - The next properties.
   *
   * @returns {Boolean} If the component should update.
   */
  // shouldComponentUpdate(nextProps) {
  //  return (
  //    nextProps.error !== this.props.error ||
  //    nextProps.validation.syntaxError !== this.props.validation.syntaxError ||
  //    nextProps.validation.isChanged !== this.props.validation.isChanged ||
  //    nextProps.serverVersion !== this.props.serverVersion ||
  //    nextProps.fields.length !== this.props.fields.length
  //  );
  // }

  /**
   * Render validation changed buttons.
   *
   * @returns {React.Component} The component.
   */
  renderValidationChangedButtons() {
    if (
      !this.props.error &&
      !this.props.validation.syntaxError &&
      this.props.validation.isChanged
    ) {
      return (
        <div
          className={classnames(styles['validation-changed-buttons'])}
        >
          <TextButton
            className="btn btn-default btn-xs"
            text="Update"
            clickHandler={this.onValidatorSave.bind(this)} />
          <TextButton
            className={`btn btn-borderless btn-xs ${classnames(styles.cancel)}`}
            text="Cancel"
            clickHandler={this.props.validatorCanceled} />
        </div>
      );
    }
  }

  /**
   * Render the syntax error.
   *
   * @returns {React.Component} The component.
   */
  renderSyntaxError() {
    if (!this.props.error && this.props.validation.syntaxError) {
      return (
        <div
          className={classnames(styles['validation-syntax-error'])}
        >
          {this.props.validation.syntaxError.message}
        </div>
      );
    }
  }

  /**
   * Render the error.
   *
   * @returns {React.Component} The component.
   */
  renderError() {
    if (this.props.error) {
      return (
        <div
          className={classnames(styles['validation-error'])}
        >
          {this.props.error.message}
        </div>
      );
    }
  }

  /**
   * Render ValidationEditor component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['validation-editor'])}>
        <div className={classnames(styles['brace-editor-container'])}>
          <AceEditor
            mode="mongodb"
            theme="mongodb"
            width="100%"
            height="100%"
            value={this.props.validation.validator}
            onChange={this.props.validatorChanged}
            editorProps={{$blockScrolling: Infinity}}
            setOptions={OPTIONS}
            onFocus={() => tools.setCompleters([this.completer])} />
          </div>
          {this.renderValidationChangedButtons()}
          {this.renderSyntaxError()}
          {this.renderError()}
      </div>
    );
  }
}

export default ValidationEditor;
