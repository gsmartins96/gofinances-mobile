import React from 'react';
import { render, fireEvent } from '@testing-library/react-native'
import { ThemeProvider } from 'styled-components/native';

import theme from '../../global/styles/theme';

import { Register } from '.'

const Providers: React.FC = ({ children }) => (
  <ThemeProvider theme={theme}>
    { children }
  </ThemeProvider>
)

describe('Register screen', () => {
  it('should be open category modal when user click on the category button', () => {
    const { getByTestId } = render(
      <Register />, {
        wrapper: Providers
      }
    );

    const categoryModal = getByTestId('modal-category');
    const buttonCategory = getByTestId('button-categroy');
    fireEvent.press(buttonCategory)

    expect(categoryModal.props.visible).toBe(true)
  });
}) 