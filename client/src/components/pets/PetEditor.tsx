import * as React from 'react';

import { IRouter, Link } from 'react-router';
import { url, submitForm } from '../../util';

import Input from '../form/Input';
import DateInput from '../form/DateInput';
import SelectInput from '../form/SelectInput';

import { IError, IOwner, IPetRequest, IEditablePet, IPet, IPetType, IRouterContext, ISelectOption } from '../../types';

interface IPetEditorProps {
  pet: IEditablePet;
  owner: IOwner;
  pettypes: ISelectOption[];
}

interface IPetEditorState {
  editablePet?: IEditablePet;
  error?: IError;
};

export default class PetEditor extends React.Component<IPetEditorProps, IPetEditorState> {
  context: IRouterContext;
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.onInputChange = this.onInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    const pet = props.pet || {};
    
    this.state = {
      editablePet: {
        ...pet,
        // Map the nested backend type object to the flat 'type' field the form uses
        type: pet.type ? pet.type.id : ''
      },
      error: undefined
    };
  }

  onSubmit(event) {
    event.preventDefault();
    const { owner, pettypes } = this.props;
    const { editablePet } = this.state;

    // Search for the selected type using the 'type' field
    const selectedPetType = editablePet.type ? pettypes.find(pt => String(pt.value) === String(editablePet.type)) : null;

    const request = {
      birthDate: editablePet.birthDate,
      name: editablePet.name,
      type: selectedPetType ? { id: Number(selectedPetType.value), name: selectedPetType.name } : null
    };

    const url = editablePet.isNew ? '/api/owners/' + owner.id + '/pets' : '/api/owners/' + owner.id + '/pets/' + editablePet.id;
    submitForm(editablePet.isNew ? 'POST' : 'PUT', url, request, (status, response) => {
      if (status === 200 || status === 201 || status === 204) {
        this.context.router.push({ pathname: '/owners/' + owner.id });
      } else {
        this.setState({ error: response });
      }
    });
  }

  onInputChange(name: string, value: string, fieldError: IFieldError) {
    const { editablePet, error } = this.state;
    const modifiedPet = Object.assign({}, editablePet, { [name]: value });
    
    // Clear the error for this specific field when the user interacts with it
    const newFieldErrors = error ? Object.assign({}, error.fieldErrors, {[name]: fieldError }) : {[name]: fieldError };

    this.setState({ 
      editablePet: modifiedPet,
      error: { fieldErrors: newFieldErrors }
    });
  }

  render() {
    const { owner, pettypes } = this.props;
    const { editablePet, error } = this.state;
    const formLabel = editablePet.isNew ? 'Add Pet' : 'Update Pet';

    return (
      <span>
        <h2>{formLabel}</h2>
        <form className='form-horizontal' method='POST' action={url('/api/owners')}>
          <div className='form-group has-feedback'>
            <div className='form-group'>
              <label className='col-sm-2 control-label'>Owner</label>
              <div className='col-sm-10'>{owner.firstName} {owner.lastName}</div>
            </div>
            <Input object={editablePet} error={error} label='Name' name='name' onChange={this.onInputChange} />
            <DateInput object={editablePet} error={error} label='Birth date' name='birthDate' onChange={this.onInputChange} />
            {/* Changed name from 'typeId' to 'type' */}
            <SelectInput object={editablePet} error={error} label='Type' name='type' options={pettypes} onChange={this.onInputChange} />
          </div>
          <div className='form-group'>
            <div className='col-sm-offset-2 col-sm-10'>
              <button className='btn btn-default' type='submit' onClick={this.onSubmit}>{formLabel}</button>
            </div>
          </div>
        </form>
      </span>
    );
  }
}
