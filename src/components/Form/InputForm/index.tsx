import React from 'react';
import { TextInputProps } from 'react-native';
import { Control, Controller } from 'react-hook-form';

import { Input } from '../Input'
import { Container, Error } from './styles';

interface Props extends TextInputProps {
  control: Control;
  name: string;
  error: string,
}

export function InputForm({ name, control, error, ...rest }: Props){
  return (
    <Container>
      <Controller 
        control={control} 
        name={name}
        render={({ field: { value, onChange } }) => (
          <Input value={value} onChangeText={onChange} {...rest} />
        )} 
      />
      {error && <Error>{error}</Error>}
    </Container>
  );
}